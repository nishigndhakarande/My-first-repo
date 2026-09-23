import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { supabase, api } from '../services/supabase';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const SIPS_AI_URL = 'https://tlorepamqatsmrdpsttx.supabase.co/functions/v1/sips-ai';

// SIPS AI Tools definition (matches backend edge function)
const AI_TOOLS = [
  { name: 'task_status_update', description: 'Mark a task as completed/done.' },
  { name: 'schedule_shift_request', description: 'Shift dates of a task.' }
];

export const ChatScreen = () => {
  const { profile, user, activeProject } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const flatListRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConv) {
        setActiveConv(convs[0]);
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeConv]);

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.warn('Error fetching messages:', err.message);
    }
  }, []);

  const fetchProjectDataForAI = useCallback(async () => {
    if (activeProject?.id) {
      try {
        const tasks = await api.getScheduleTasks(activeProject.id);
        setProjectTasks(tasks);
      } catch (err) {
        console.warn('Error fetching project tasks for AI context:', err.message);
      }
    }
  }, [activeProject]);

  useEffect(() => {
    fetchConversations();
    fetchProjectDataForAI();
  }, [fetchConversations, fetchProjectDataForAI]);

  useEffect(() => {
    if (activeConv?.id) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv, fetchMessages]);

  const postAiMessage = async (body) => {
    try {
      // Optimistically show AI message
      const tempAiMsg = {
        id: Date.now() + 1,
        sender_name: 'SIPS AI',
        sender_role: 'ai',
        body: body,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempAiMsg]);

      const { data, error } = await api.sendMessage(
        activeConv.id,
        'SIPS AI',
        'ai',
        body,
        null
      );
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Failed to save AI response:', err);
    }
  };

  const executeAiAction = async (action) => {
    try {
      // Direct update implementation as a fallback for RPC
      if (action.type === 'task_status_update') {
        const { error } = await supabase.from('schedule_tasks')
          .update({ status: 'completed' })
          .eq('id', action.target_id);
        if (error) throw error;
        Alert.alert('Success', 'Task marked as completed!');
      } else if (action.type === 'schedule_shift_request') {
        const { error } = await supabase.from('schedule_tasks')
          .update({ 
             start_date: action.payload.proposed_start,
             due_date: action.payload.proposed_end
          })
          .eq('id', action.target_id);
        if (error) throw error;
        Alert.alert('Success', 'Schedule updated successfully!');
      } else {
        // Try calling the remote RPC if it's an unknown action but supported by web
        const { error } = await supabase.rpc('execute_ai_action', { action_json: action });
        if (error) throw error;
        Alert.alert('Success', 'Action executed via RPC!');
      }
      
      // Refresh context so AI knows about the change
      fetchProjectDataForAI();
    } catch (err) {
      Alert.alert('Action Failed', err.message);
    }
  };

  const promptAiActions = (actions) => {
    if (!actions || actions.length === 0) return;
    
    // Process the first action as an example
    const action = actions[0];
    
    Alert.alert(
      'AI Proposal',
      action.confirm_text || 'Are you sure you want to execute this action?',
      [
        { text: 'Reject', style: 'cancel' },
        { text: 'Confirm & Execute', onPress: () => executeAiAction(action) }
      ]
    );
  };

  const handleAttachImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
      if (!result.canceled && result.assets.length > 0) {
        setPendingAttachment(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  const uploadAttachment = async (uri, ext) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `chat_${Date.now()}.${ext}`;
      const path = `chat-media/${fileName}`;
      
      const { error: upErr } = await supabase.storage.from('project-media').upload(path, blob, {
        contentType: `image/${ext}`
      });
      
      if (upErr) throw upErr;
      const { data: pubData } = supabase.storage.from('project-media').getPublicUrl(path);
      return pubData.publicUrl;
    } catch (error) {
      console.warn('Upload error:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !pendingAttachment) || !activeConv) return;
    const textToSend = inputText.trim() || '📸 Sent a photo';
    setInputText('');
    setSending(true);

    const senderName = profile?.full_name || 'Mobile User';
    const senderRole = profile?.role || 'Team';

    const tempMsg = {
      id: Date.now(),
      sender_name: senderName,
      sender_role: senderRole,
      sender_id: user?.id,
      body: textToSend,
      created_at: new Date().toISOString(),
      attachment_url: pendingAttachment ? pendingAttachment.uri : null
    };
    setMessages((prev) => [...prev, tempMsg]);

    let finalAttachmentUrl = null;
    if (pendingAttachment) {
      const ext = pendingAttachment.uri.split('.').pop() || 'jpg';
      finalAttachmentUrl = await uploadAttachment(pendingAttachment.uri, ext);
      setPendingAttachment(null);
    }

    try {
      await api.sendMessage(activeConv.id, senderName, senderRole, textToSend, user?.id, finalAttachmentUrl);
      
      if (activeConv.type === 'ai') {
        const history = messages.slice(-10).map(m => ({
          role: m.sender_role === 'ai' ? 'assistant' : 'user',
          content: m.body
        }));
        
        try {
          const aiPayload = {
            text: textToSend,
            role: profile?.role,
            project_id: activeProject?.id,
            tools: AI_TOOLS,
            data: { tasks: projectTasks }, // Feeding live DB tasks to AI
            history: history,
          };

          const resp = await fetch(SIPS_AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiPayload)
          });
          
          if (resp.ok) {
            const result = await resp.json();
            
            // 1. Post the text reply
            if (result.reply) {
              await postAiMessage(result.reply);
            }
            
            // 2. Prompt for execution of actions!
            if (result.actions && result.actions.length > 0) {
              promptAiActions(result.actions);
            }
          } else {
            const errText = await resp.text();
            Alert.alert("AI Error", `Server returned ${resp.status}: ${errText}`);
          }
        } catch (e) {
          Alert.alert("Network Error", "Failed to reach AI server: " + e.message);
          console.warn('AI understand failed, skipping AI reply:', e);
        }
      }

      await fetchMessages(activeConv.id);
    } catch (err) {
      console.warn('Failed to send message:', err.message);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id || item.sender_name === profile?.full_name;
    const isAi = item.sender_role === 'ai' || item.is_ai;

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <View style={[styles.avatarMini, isAi && { backgroundColor: colors.brandOrange }]}>
            <Text style={styles.avatarMiniText}>{isAi ? 'AI' : (item.sender_name || 'U')[0].toUpperCase()}</Text>
          </View>
        )}

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, isAi && styles.bubbleAi]}>
          {!isMe && (
            <View style={styles.senderHeader}>
              {isAi && <Ionicons name="sparkles" size={12} color={colors.brandOrange} style={{marginRight: 4}} />}
              <Text style={[styles.senderName, isAi && {color: colors.brandOrange}]}>{item.sender_name}</Text>
              {item.sender_role && !isAi && <Text style={styles.senderRole}>({item.sender_role})</Text>}
            </View>
          )}

          {item.attachment_url && (
             <Image source={{ uri: item.attachment_url }} style={styles.chatImage} />
          )}

          {item.body ? <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.body}</Text> : null}

          <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
            {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Header title="Collaboration" subtitle={activeConv ? (activeConv.title || (activeConv.type === 'ai' ? 'SIPS AI Assistant' : 'Chat')) : 'Team Discussions'} />

      {conversations.length > 0 && (
        <View style={styles.channelBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={conversations}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
            renderItem={({ item }) => {
              const isSelected = activeConv?.id === item.id;
              const isAi = item.type === 'ai';
              return (
                <TouchableOpacity style={[styles.chanPill, isSelected && styles.chanPillActive, isAi && !isSelected && {borderColor: colors.brandOrange}]} onPress={() => setActiveConv(item)}>
                  {isAi && <Ionicons name="sparkles" size={12} color={isSelected ? '#FFF' : colors.brandOrange} style={{marginRight: 4}} />}
                  <Text style={[styles.chanText, isSelected && styles.chanTextActive, isAi && !isSelected && {color: colors.brandOrange}]}>
                    {item.title || (isAi ? 'SIPS AI' : 'Channel #' + item.id)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
               <Ionicons name="chatbubbles-outline" size={44} color={colors.muted3} />
               <Text style={styles.emptyTitle}>No messages yet</Text>
               <Text style={styles.emptySubtitle}>Start the conversation below.</Text>
            </View>
          }
        />
      )}

      {/* Pending Attachment Preview */}
      {pendingAttachment && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: pendingAttachment.uri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.previewClose} onPress={() => setPendingAttachment(null)}>
            <Ionicons name="close-circle" size={24} color={colors.statusBad} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.attachBtn} onPress={handleAttachImage}>
          <Ionicons name="add-circle-outline" size={26} color={colors.muted} />
        </TouchableOpacity>
        <TextInput
          style={styles.inputField}
          placeholder="Message..."
          placeholderTextColor={colors.muted2}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, (!inputText.trim() && !pendingAttachment) && {opacity: 0.5}]} onPress={handleSend} disabled={(!inputText.trim() && !pendingAttachment) || sending}>
          {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' }, // WhatsApp background color
  channelBar: { backgroundColor: '#F0F0F0', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  chanPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.pill, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.line },
  chanPillActive: { backgroundColor: '#075E54', borderColor: '#075E54' }, // WhatsApp dark green
  chanText: { fontSize: 13, fontWeight: '600', color: colors.ink700 },
  chanTextActive: { color: '#FFFFFF' },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatarMini: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#075E54', alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs, marginTop: 4 },
  avatarMiniText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  bubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  bubbleMe: { backgroundColor: '#DCF8C6', borderTopRightRadius: 0 }, // WhatsApp outgoing green
  bubbleOther: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 0 }, // WhatsApp incoming white
  bubbleAi: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 0 }, // AI gets white too for WA feel
  senderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  senderName: { fontSize: 12, fontWeight: '700', color: '#075E54', marginRight: 4 }, // Name in WA style
  senderRole: { fontSize: 10, color: colors.muted },
  messageText: { fontSize: 15, color: '#000000', lineHeight: 20 },
  messageTextMe: { color: '#000000' },
  chatImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 4, backgroundColor: colors.line },
  timeText: { fontSize: 10, color: 'rgba(0,0,0,0.45)', alignSelf: 'flex-end', marginTop: 2 },
  timeTextMe: { color: 'rgba(0,0,0,0.45)' },
  
  previewContainer: { padding: spacing.md, backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'flex-start' },
  previewImage: { width: 60, height: 60, borderRadius: 8 },
  previewClose: { position: 'absolute', top: 4, left: 64, backgroundColor: '#FFF', borderRadius: 12 },
  
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, backgroundColor: '#F0F0F0' }, // WA input background
  attachBtn: { padding: 8, marginRight: 4 },
  inputField: { flex: 1, minHeight: 42, maxHeight: 100, backgroundColor: '#FFFFFF', borderRadius: 21, paddingHorizontal: spacing.md, paddingTop: 11, paddingBottom: 11, fontSize: 15, color: '#000' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#128C7E', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm }, // WA green send btn
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink800, marginTop: spacing.md },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
