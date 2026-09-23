import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://tlorepamqatsmrdpsttx.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_yLXE201tGNBWp4H49FdIlQ_OICGk29t';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper API functions
export const api = {
  // Authentication & Profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, company_id, full_name, is_active')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Projects
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createProject(projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Schedule / Milestones
  async getScheduleTasks(projectId) {
    let query = supabase.from('schedule_tasks').select('*');
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query.order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Tasks (My Tasks / Project Tasks)
  async getProjectTasks(projectId) {
    let query = supabase.from('schedule_tasks').select('*');
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query.order('id', { ascending: false });
    if (error) {
      console.warn('schedule_tasks query failed:', error.message);
      return [];
    }
    return data || [];
  },

  async requestReschedule(taskId, projectId, proposedStart, proposedEnd, reason) {
    const record = {
      project_id: projectId,
      task_id: taskId,
      proposed_start: proposedStart,
      proposed_end: proposedEnd,
      reason: reason || 'Requested via Mobile App',
      approval_status: 'pending'
    };
    const { data, error } = await supabase.from('schedule_change_requests').insert(record).select();
    if (error) throw error;
    
    if (data && data.length > 0) {
      const reqId = data[0].id;
      const { error: e2 } = await supabase.from('schedule_tasks').update({ pending_request_id: reqId }).eq('id', taskId);
      if (e2) throw e2;
    }
    return data[0];
  },

  async saveScheduleTask(taskData) {
    if (taskData.id) {
      const { data, error } = await supabase.from('schedule_tasks').update(taskData).eq('id', taskData.id).select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('schedule_tasks').insert(taskData).select();
      if (error) throw error;
      return data;
    }
  },

  async deleteScheduleTask(taskId) {
    const { error } = await supabase.from('schedule_tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  async updateTaskStatus(taskId, status) {
    const { data, error } = await supabase
      .from('schedule_tasks')
      .update({ status })
      .eq('id', taskId);
    if (error) {
      throw error;
    }
    return data;
  },

  // Budget
  async getBudgetItems(projectId) {
    let q1 = supabase.from('budget_items').select('*');
    let q2 = supabase.from('payment_transactions').select('budget_item_id, amount, final_amount, status');
    if (projectId) {
      q1 = q1.eq('project_id', projectId);
      q2 = q2.eq('project_id', projectId);
    }
    
    const [resItems, resTxs] = await Promise.all([q1, q2]);
    if (resItems.error) {
      console.warn('budget_items query failed:', resItems.error.message);
      return [];
    }
    
    const items = resItems.data || [];
    const txs = resTxs.data || [];
    
    // Map paid amount
    const paidByItem = {};
    txs.forEach(t => {
      if (t.status === 'reversed') return;
      const amt = Number(t.final_amount != null ? t.final_amount : (t.amount || 0));
      paidByItem[t.budget_item_id] = (paidByItem[t.budget_item_id] || 0) + amt;
    });

    return items.map(i => ({
      ...i,
      amount: i.total_amount != null ? i.total_amount : i.gross_amount,
      paid_amount: paidByItem[i.id] || 0,
      category: i.milestone || 'General'
    }));
  },

  async saveBudgetItem(itemData) {
    if (itemData.id) {
      const { data, error } = await supabase.from('budget_items').update(itemData).eq('id', itemData.id).select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('budget_items').insert(itemData).select();
      if (error) throw error;
      return data;
    }
  },

  async deleteBudgetItem(itemId) {
    const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  // Quality / NCR
  async getQualityIssues(projectId) {
    let query = supabase.from('quality_checks').select('*');
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('quality_checks query failed:', error.message);
      return [];
    }
    return data || [];
  },

  async saveQualityCheck(checkData) {
    if (checkData.id) {
      const { data, error } = await supabase.from('quality_checks').update(checkData).eq('id', checkData.id).select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('quality_checks').insert(checkData).select();
      if (error) throw error;
      return data;
    }
  },

  async deleteQualityCheck(checkId) {
    const { error } = await supabase.from('quality_checks').delete().eq('id', checkId);
    if (error) throw error;
  },

  // Drawings
  async getDrawings(projectId) {
    let query = supabase.from('drawings').select('*');
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('drawings query failed:', error.message);
      return [];
    }
    return data || [];
  },

  async uploadMedia(projectId, fileUri, fileName, mimeType, fileCategory, discipline, siteDate) {
    // 1. Convert local URI to Blob
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // 2. Upload to Storage
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `projects/${projectId}/${Date.now()}_${safeName}`;
    
    const { error: upErr } = await supabase.storage.from('project-media').upload(path, blob, {
      contentType: mimeType || undefined
    });
    if (upErr) throw upErr;
    
    // 3. Get Public URL
    const { data: pubData } = supabase.storage.from('project-media').getPublicUrl(path);
    const publicUrl = pubData?.publicUrl;
    
    // 4. Insert into 'drawings' table
    const { data, error } = await supabase.from('drawings').insert({
      project_id: projectId,
      name: fileName,
      discipline: discipline || 'General',
      file_type: fileCategory,
      file_url: publicUrl,
      status: fileCategory === 'drawing' ? 'pending' : null,
      version: 1,
      site_date: siteDate
    }).select();
    
    if (error) throw error;
    return data;
  },

  // Chat Conversations
  async getConversations() {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (error) {
      console.warn('chat_conversations query failed:', error.message);
      return [];
    }
    return data || [];
  },

  // Chat Messages
  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async sendMessage(conversationId, senderName, senderRole, body, senderId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_name: senderName,
          sender_role: senderRole,
          body: body,
          sender_id: senderId || null,
        },
      ])
      .select()
      .single();
    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_preview: body.slice(0, 100),
      })
      .eq('id', conversationId);

    return data;
  },

  // Approvals (Synthesized from multiple tables)
  async getApprovals(projectId) {
    try {
      // 1. Schedule Change Requests
      let schedQuery = supabase.from('schedule_change_requests').select('*');
      if (projectId) schedQuery = schedQuery.eq('project_id', projectId);
      
      // 2. Payment Adjustments
      let payQuery = supabase.from('payment_adjustments').select('*');
      if (projectId) payQuery = payQuery.eq('project_id', projectId);

      // 3. Change Orders
      let coQuery = supabase.from('change_orders').select('*');
      if (projectId) coQuery = coQuery.eq('project_id', projectId);

      const [schedRes, payRes, coRes] = await Promise.all([
        schedQuery,
        payQuery,
        coQuery
      ]);

      const approvals = [];

      (schedRes.data || []).forEach(r => {
        approvals.push({
          ...r,
          _type: 'schedule_change',
          _title: 'Schedule Shift Request',
          _status: r.approval_status || 'pending',
          _created: r.created_at
        });
      });

      (payRes.data || []).forEach(r => {
        approvals.push({
          ...r,
          _type: 'payment_adjustment',
          _title: `Payment \${r.request_type || 'Adjustment'}`,
          _status: r.approval_status || 'pending',
          _created: r.requested_at || r.created_at
        });
      });

      (coRes.data || []).forEach(r => {
        approvals.push({
          ...r,
          _type: 'change_order',
          _title: `Change Order: \${r.description || 'Unknown'}`,
          _status: r.status || 'pending',
          _created: r.created_at
        });
      });

      return approvals.sort((a, b) => new Date(b._created) - new Date(a._created));
    } catch (err) {
      console.warn('Approvals synthesis failed:', err.message);
      return [];
    }
  },

  // Notifications
  async getNotifications(userId) {
    let query = supabase.from('notifications').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('notifications query failed:', error.message);
      return [];
    }
    return data || [];
  },

  // Vendors
  async getVendors() {
    const { data, error } = await supabase.from('vendors').select('*').order('name', { ascending: true });
    if (error) {
      console.warn('vendors query failed:', error.message);
      return [];
    }
    return data || [];
  },

  async saveVendor(vendorData) {
    if (vendorData.id) {
      const { data, error } = await supabase.from('vendors').update(vendorData).eq('id', vendorData.id).select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('vendors').insert(vendorData).select();
      if (error) throw error;
      return data;
    }
  },

  async deleteVendor(vendorId) {
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
    if (error) throw error;
  },

  // Users (Admin)
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) {
      console.warn('users query failed:', error.message);
      return [];
    }
    return data || [];
  },

  async updateUser(userId, patch) {
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select();
    if (error) throw error;
    return data;
  },

  async inviteUser(payload) {
    const { data, error } = await supabase.functions.invoke('invite-user', { body: payload });
    if (error) throw error;
    return data;
  }
};
