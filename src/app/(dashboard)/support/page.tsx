"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { tickets } from "@/data/tickets";
import { Column, Ticket } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  SendHorizontal,
  MoreHorizontal,
  Reply,
  Bookmark,
  Pencil,
  Trash2,
  CircleDot,
  Flag,
  X,
  Smile,
  Mail,
  MailOpen,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function SupportPage() {
  const searchParams = useSearchParams();
  const notificationTicketId = searchParams.get("ticket");
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);
  const [ticketUserProfile, setTicketUserProfile] = useState<any | null>(null);
  const [myProfile, setMyProfile] = useState<any | null>(null);
  const [savedReplyIds, setSavedReplyIds] = useState<string[]>([]);
  const [savedTicketIds, setSavedTicketIds] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [messageMenuDirection, setMessageMenuDirection] =
  useState<"up" | "down">("down");
  const [ticketProfiles, setTicketProfiles] = useState<Record<string, any>>({});
  const [replyProfiles, setReplyProfiles] = useState<Record<string, any>>({});
  const inboxUsers = useMemo(() => {
  return [...supportTickets].sort((a, b) => {
    const aTime = new Date(a.lastReply || a.created).getTime();
    const bTime = new Date(b.lastReply || b.created).getTime();

    return bTime - aTime;
  });
}, [supportTickets]);

useEffect(() => {
  if (!notificationTicketId || supportTickets.length === 0) return;

  const ticketFromNotification = supportTickets.find(
    (ticket) => ticket.id === notificationTicketId
  );

  if (ticketFromNotification) {
    setSelectedTicket(ticketFromNotification);
  }
}, [notificationTicketId, supportTickets]);

useEffect(() => {
  if (!selectedTicket?.id) return;

  const timer = window.setTimeout(() => {
    replyInputRef.current?.focus();
  }, 100);

  return () => window.clearTimeout(timer);
}, [selectedTicket?.id]);
  const [highlightedReplyId, setHighlightedReplyId] =
  useState<string | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] =
  useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const isSupportUser =
  myProfile?.role === "support" ||
  myProfile?.role === "admin";
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationPartnerProfile, setConversationPartnerProfile] =
  useState<any | null>(null);
  const initialTicketProfile = selectedTicket
  ? ticketProfiles[selectedTicket.userId] ??
    (selectedTicket.userId === currentUserId ? myProfile : null) ??
    ticketUserProfile ??
    null
  : null;
  const getProfileName = (profile: any) => {
  return (
    profile?.full_name ||
    profile?.name ||
    profile?.username ||
    profile?.email ||
    "User"
  );
  };

  const getProfileRoleLabel = (profile: any) => {
  if (!profile?.role) return null;

  if (profile.role === "admin") return "ADMIN";
  if (profile.role === "support") return "SUPPORT";

  return null;
};

const isStaffProfile = (profile: any) =>
  profile?.role === "admin" || profile?.role === "support";

  const getProfileAvatar = (profile: any) => {
    return (
      profile?.avatar_url ||
      profile?.avatar ||
      profile?.photo_url ||
      null
    );
  };

  const formatToastTime = (dateString: string) => {
  const diff = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );

  if (diff < 60) return "Just now";

  const minutes = Math.floor(diff / 60);

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
};
  const getReplyProfile = (reply: any) => {
  if (reply.user_id === currentUserId) {
    return myProfile;
  }

  return (
    ticketProfiles[reply.user_id] ||
    conversationPartnerProfile ||
    ticketUserProfile ||
    null
  );
};
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
  const loadConversationProfiles = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error loading current user:", userError);
      return;
    }

    setCurrentUserId(user.id);

    const { data: currentProfile, error: currentProfileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (currentProfileError) {
  console.error(
    "Error loading current profile:",
    currentProfileError
  );
  } else {
  console.log("CURRENT PROFILE:", currentProfile);
  setMyProfile(currentProfile);
  }

    const partnerUserId =
  currentProfile?.role === "support" || currentProfile?.role === "admin"
    ? selectedTicket?.userId
    : selectedTicket?.assignedTo;

  if (!partnerUserId) {
  setConversationPartnerProfile(null);
  return;
  }

  const { data: ticketProfile, error: ticketProfileError } =
  await supabase
    .from("profiles")
    .select("*")
    .eq("id", partnerUserId)
    .maybeSingle();

    if (ticketProfileError) {
      console.error(
        "Error loading ticket user profile:",
        ticketProfileError
      );
      return;
    }

    setConversationPartnerProfile(ticketProfile);
  };
  loadConversationProfiles();
}, [selectedTicket, supabase]);

useEffect(() => {
  const assignTicketToCurrentSupport = async () => {
    if (!selectedTicket || !currentUserId || !myProfile) return;

    const isSupport =
      myProfile.role === "support" ||
      myProfile.role === "admin";

    // Normal user কখনো ticket assign করতে পারবে না
    if (!isSupport) return;

    // নিজের তৈরি ticket হলে assign করবে না
    if (selectedTicket.userId === currentUserId) return;

    // Already assigned হলে overwrite করবে না
    if (selectedTicket.assignedTo) return;

    const { error } = await supabase
      .from("support_tickets")
      .update({
        assigned_to: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTicket.id);

    if (error) {
      console.error("Error assigning support ticket:", error);
      return;
    }

    setSelectedTicket((prev: any) =>
      prev
        ? { ...prev, assignedTo: currentUserId }
        : prev
    );

    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, assignedTo: currentUserId }
          : ticket
      )
    );
  };

  assignTicketToCurrentSupport();
}, [
  selectedTicket,
  currentUserId,
  myProfile,
  supabase,
]);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target as Node)
    ) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  const loadTicketProfiles = async () => {
    const userIds = [
      ...new Set(
        supportTickets
          .flatMap((ticket) => [ticket.userId, ticket.assignedTo])
          .filter(Boolean)
      ),
    ] as string[];
  
    if (userIds.length === 0) {
      setTicketProfiles({});
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (error) {
      console.error("Error loading ticket profiles:", error);
      return;
    }

    const profileMap = (data ?? []).reduce(
      (acc: Record<string, any>, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      },
      {}
    );

    setTicketProfiles(profileMap);
  };

  loadTicketProfiles();
}, [supportTickets, supabase]);


 useEffect(() => {
  conversationEndRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
}, [selectedTicket, ticketReplies]);

useEffect(() => {
  if (!selectedTicket?.id || !currentUserId) return;

  const markTicketNotificationsAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", currentUserId)
      .eq("ticket_id", selectedTicket.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking ticket notifications as read:", error);
    }
  };

  markTicketNotificationsAsRead();
}, [selectedTicket?.id, currentUserId, ticketReplies.length, supabase]);

useEffect(() => {
  const loadConversationPartner = async () => {
    if (!selectedTicket || !currentUserId || !myProfile) {
      setConversationPartnerProfile(null);
      return;
    }

    const isSupport =
      myProfile.role === "support" ||
      myProfile.role === "admin";

    let partnerUserId: string | null = null;

    if (isSupport) {
      // Support/Admin side → ticket creator-এর profile
      partnerUserId = selectedTicket.userId;
    } else {
      // User side → assigned support/admin-এর profile
      partnerUserId = selectedTicket.assignedTo ?? null;

      // পুরনো ticket fallback
      if (!partnerUserId) {
        const supportReply = ticketReplies.find(
          (reply) => reply.user_id !== currentUserId
        );

        partnerUserId = supportReply?.user_id ?? null;
      }
    }

    if (!partnerUserId) {
      setConversationPartnerProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", partnerUserId)
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading conversation partner:",
        error
      );
      return;
    }

    setConversationPartnerProfile(data);
  };

  loadConversationPartner();
}, [
  selectedTicket,
  currentUserId,
  myProfile,
  ticketReplies,
  supabase,
]);
useEffect(() => {
  const handleMessageMenuOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.closest("[data-message-menu]")) {
      setOpenMessageMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleMessageMenuOutside);

  return () => {
    document.removeEventListener("mousedown", handleMessageMenuOutside);
  };
}, []);
useEffect(() => {
  const loadSavedMessages = async () => {
    if (!currentUserId) {
      setSavedReplyIds([]);
      setSavedTicketIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("support_saved_messages")
      .select("reply_id, ticket_id")
      .eq("user_id", currentUserId);

    if (error) {
  console.log("Saved messages error:", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
  return;
}

    setSavedReplyIds(
      (data ?? [])
        .filter((item) => item.reply_id)
        .map((item) => item.reply_id)
    );

    setSavedTicketIds(
      (data ?? [])
        .filter((item) => item.ticket_id)
        .map((item) => item.ticket_id)
    );
  };

  loadSavedMessages();
}, [currentUserId, supabase]);

  const canModifyReply = (createdAt: string) => {
  const createdTime = new Date(createdAt).getTime();
  const currentTime = Date.now();

  const fifteenMinutes = 15 * 60 * 1000;

  return currentTime - createdTime <= fifteenMinutes;
  };
  useEffect(() => {
  const loadTicketReplies = async () => {
    if (!selectedTicket) {
      setTicketReplies([]);
      return;
    }

    const { data, error } = await supabase
      .from("support_ticket_replies")
      .select("*")
      .eq("ticket_id", selectedTicket.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading ticket replies:", error);
      return;
    }

    setTicketReplies(data ?? []);
  };

  loadTicketReplies();
}, [selectedTicket, supabase]);

useEffect(() => {
  if (!selectedTicket?.id) return;

  const channel = supabase
    .channel(`ticket-replies-${selectedTicket.id}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "support_ticket_replies",
        filter: `ticket_id=eq.${selectedTicket.id}`,
      },
      (payload) => {
        const newReply = payload.new as any;

        setTicketReplies((prev) => {
          const alreadyExists = prev.some(
            (reply) => reply.id === newReply.id
          );

          if (alreadyExists) return prev;

          return [...prev, newReply];
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedTicket?.id, supabase]);

useEffect(() => {
  const loadReplyProfiles = async () => {
    const userIds = [
      ...new Set(
        ticketReplies
          .map((reply: any) => reply.user_id)
          .filter(Boolean)
      ),
    ];

    if (userIds.length === 0) {
      setReplyProfiles({});
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (error) {
      console.error("Error loading reply profiles:", error);
      return;
    }

    const profilesMap = (data ?? []).reduce(
      (acc: Record<string, any>, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      },
      {}
    );

    setReplyProfiles(profilesMap);
  };

  loadReplyProfiles();
}, [ticketReplies, supabase]);

  const columns: Column<Ticket>[] = [
  { key: "id", header: "#" },
  {
  key: "subject",
  header: "Subject",
  render: (r) => (
    <button
      type="button"
      onClick={() => setSelectedTicket(r)}
      className="font-medium text-blue-600 hover:underline">
          {r.subject}
        </button>
      ),
    },
  { key: "tags", header: "Tags", render: (r) => r.tags.join(", ") },
  { key: "department", header: "Department" },
  { key: "service", header: "Service" },
  { key: "contact", header: "Contact" },
  { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} /> },
  { key: "priority", header: "Priority", render: (r) => <StatusBadge label={r.priority} /> },
  { key: "lastReply", header: "Last Reply" },
  { key: "created", header: "Created" },
  ];
  const counts = useMemo(
  () => ({
    Open: supportTickets.filter((ticket) => ticket.status === "Open").length,
    "In Progress": supportTickets.filter(
      (ticket) => ticket.status === "In Progress"
    ).length,
    Answered: supportTickets.filter(
      (ticket) => ticket.status === "Answered"
    ).length,
    "On Hold": supportTickets.filter(
      (ticket) => ticket.status === "On Hold"
    ).length,
    Closed: supportTickets.filter(
      (ticket) => ticket.status === "Closed"
    ).length,
    }),
    [supportTickets]
  );

  const hasActiveTicket = useMemo(() => {
  if (isSupportUser) return false;

  return supportTickets.some(
    (ticket) => ticket.status !== "Closed"
  );
}, [isSupportUser, supportTickets]);

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [success, setSuccess] = useState("");
  const [liveNotification, setLiveNotification] = useState<{
  title: string;
  message: string;
  ticketId: string | null;
  senderName: string;
  senderAvatar: string | null;
  createdAt: string;
  } | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyMessage, setEditingReplyMessage] = useState("");
  useEffect(() => {
  const loadSupportTickets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let query = supabase
  .from("support_tickets")
  .select("*")
  .order("created_at", { ascending: false });

  if (!isSupportUser) {
  query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  console.log("SUPPORT TICKET DEBUG:", {
  isSupportUser,
  currentUserId: user.id,
  ticketCount: data?.length,
  tickets: data?.map((ticket) => ({
    id: ticket.id,
    user_id: ticket.user_id,
    subject: ticket.subject,
  })),
});

    if (error) {
      console.error("Error loading support tickets:", error);
      return;
    }
    const ticketIds = (data ?? []).map((ticket) => ticket.id);

    let latestReplies: any[] = [];

    if (ticketIds.length > 0) {
      const { data: repliesData, error: repliesError } = await supabase
        .from("support_ticket_replies")
        .select("ticket_id, user_id, message, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false });

      if (repliesError) {
        console.error("Error loading latest ticket replies:", repliesError);
      } else {
        latestReplies = repliesData ?? [];
      }
    }

    const latestReplyMap = latestReplies.reduce(
  (acc: Record<string, any>, reply: any) => {
    if (!acc[reply.ticket_id]) {
      acc[reply.ticket_id] = reply;
    }

        return acc;
      },
      {}
    );
    const formattedTickets = (data ?? []).map((ticket) => ({
      id: ticket.id,
      userId: ticket.user_id,
      assignedTo: ticket.assigned_to,
      subject: ticket.subject,
      message: ticket.message,
      lastMessage:
      latestReplyMap[ticket.id]?.message || ticket.message,

      lastMessageUserId:
      latestReplyMap[ticket.id]?.user_id || ticket.user_id,

      lastMessageAt:
      latestReplyMap[ticket.id]?.created_at || ticket.created_at,
      tags: [],
      department: "Support",
      service: "General",
      contact: user.email ?? "-",
      status:
        ticket.status === "in_progress"
          ? "In Progress"
          : ticket.status === "on_hold"
          ? "On Hold"
          : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1),
      priority:
        ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1),
          lastReply: ticket.last_reply_at
            ? new Date(ticket.last_reply_at).toLocaleString()
            : "-",
      created: new Date(ticket.created_at).toLocaleDateString(),
    }));

    setSupportTickets(formattedTickets);
  };

  loadSupportTickets();
}, [supabase, isSupportUser, ticketsRefreshKey]);

 useEffect(() => {
  if (!currentUserId || !isSupportUser) return;

  const channel = supabase
    .channel(
      `support-new-ticket-notifications-${currentUserId}-${Date.now()}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${currentUserId}`,
      },
      async (payload) => {
        const notification = payload.new as any;

        // New support ticket
        if (notification.type === "new_ticket") {
        setTicketsRefreshKey((prev) => prev + 1);

        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", notification.sender_id)
          .maybeSingle();

        const senderName =
          senderProfile?.full_name ||
          senderProfile?.email ||
          "User";

        setLiveNotification({
          title: "New support ticket",
          message:
            notification.message ||
            "A user created a new support ticket.",
          ticketId: notification.ticket_id || null,
          senderName,
          senderAvatar: senderProfile?.avatar_url || null,
          createdAt: notification.created_at || new Date().toISOString(),
        });

        window.setTimeout(() => {
          setLiveNotification(null);
        }, 5000);
      }

        // New message from a user
        if (notification.type === "ticket_reply") {
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, email, avatar_url")
            .eq("id", notification.sender_id)
            .maybeSingle();

          const senderName =
            senderProfile?.full_name ||
            senderProfile?.email ||
            "User";

          // Current open conversation-এর message হলে bottom popup লাগবে না
         setLiveNotification({
          title: "You have a new message",
          message: `${senderName}: ${notification.message || ""}`,
          ticketId: notification.ticket_id || null,
          senderName,
          senderAvatar: senderProfile?.avatar_url || null,
          createdAt: notification.created_at || new Date().toISOString(),
        });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [
  currentUserId,
  isSupportUser,
  selectedTicket?.id,
  supabase,
]);

  const handleCreateTicket = async () => {
    if (hasActiveTicket) {
  setSuccess(
    "You already have an active support ticket. Please wait until it is closed."
  );
  return;
}
  const cleanSubject = ticketSubject.trim();
  const cleanMessage = ticketMessage.trim();

  if (!cleanSubject || !cleanMessage) {
    alert("Subject and message are required.");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("User session not found.");
    return;
  }

  const { data: newTicket, error } = await supabase
  .from("support_tickets")
  .insert({
    user_id: user.id,
    subject: cleanSubject,
    message: cleanMessage,
    priority: ticketPriority,
    status: "open",
  })
  .select("*")
  .single();

  if (error) {
    console.error("Error creating support ticket:", error);
    alert(error.message);
    return;
  }

  if (newTicket) {
  setSupportTickets((prev) => [
    {
      id: newTicket.id,
      userId: user.id,
      assignedTo: newTicket.assigned_to,
      subject: newTicket.subject,
      message: newTicket.message,
      tags: [],
      department: "Support",
      service: "General",
      contact: user.email ?? "-",
      status: "Open",
      priority:
        newTicket.priority.charAt(0).toUpperCase() +
        newTicket.priority.slice(1),
      lastReply: "-",
      created: new Date(newTicket.created_at).toLocaleDateString(),
    },
    ...prev,
  ]);
  }

    setTicketSubject("");
    setTicketMessage("");
    setTicketPriority("medium");
    setIsNewTicketOpen(false);
    setSuccess("Support ticket created successfully!");

    setTimeout(() => {
      setSuccess(""); 
    }, 2600);
    };

    const handleUpdateTicketStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    const { error } = await supabase
  .from("support_tickets")
  .update({
    status: newStatus,
    updated_at: new Date().toISOString(),
  })
  .eq("id", selectedTicket.id);

    if (error) {
      console.error("Error updating ticket status:", error);
      alert(error.message);
      return;
    }

    const displayStatus =
      newStatus === "in_progress"
        ? "In Progress"
        : newStatus === "on_hold"
        ? "On Hold"
        : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: displayStatus }
          : ticket
      )
    );

    setSelectedTicket((prev: any) =>
      prev ? { ...prev, status: displayStatus } : prev
    );
  };

    const handleUpdateTicketPriority = async (newPriority: string) => {
      if (!selectedTicket) return;

      const { error } = await supabase
        .from("support_tickets")
        .update({
          priority: newPriority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      if (error) {
        console.error("Error updating ticket priority:", error);
        alert(error.message);
        return;
      }

      const displayPriority =
        newPriority.charAt(0).toUpperCase() + newPriority.slice(1);

      setSupportTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicket.id
            ? { ...ticket, priority: displayPriority }
            : ticket
        )
      );

      setSelectedTicket((prev: any) =>
        prev ? { ...prev, priority: displayPriority } : prev
      );
      };

      const handleDeleteTicket = async () => {
      if (!selectedTicket) return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this support ticket?"
      );

      if (!confirmed) return;

      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", selectedTicket.id);

      if (error) {
        console.error("Error deleting support ticket:", error);
        alert(error.message);
        return;
      }

      setSupportTickets((prev) =>
        prev.filter((ticket) => ticket.id !== selectedTicket.id)
      );

      setSelectedTicket(null);

      setSuccess("Support ticket deleted successfully!");

      setTimeout(() => {
        setSuccess("");
      }, 2600);
    };

        const handleSubmitReply = async () => {
      if (!selectedTicket) return;

      const cleanReply = replyMessage.trim();

      if (!cleanReply) {
        alert("Reply message is required.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("User session not found.");
        return;
      }

      const { data: newReply, error } = await supabase
    .from("support_ticket_replies")
    .insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message: cleanReply,
      reply_to_id:
        replyingTo?.sourceType === "reply"
          ? replyingTo.id
          : null,

      reply_to_ticket_id:
        replyingTo?.sourceType === "ticket"
          ? replyingTo.id
          : null,
    })
    .select("*")
    .single();

      if (error) {
        console.error("Error submitting ticket reply:", error);
        alert(error.message);
        return;
      }

        if (newReply) {
          setTicketReplies((prev) => [...prev, newReply]);

          const replyTime = new Date(newReply.created_at).toLocaleString();

          setSupportTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === selectedTicket.id
                ? { ...ticket, lastReply: replyTime }
                : ticket
            )
          );
        }

      setReplyMessage("");
      setReplyingTo(null);
    };

      const handleUpdateReply = async (replyId: string, createdAt: string) => {
      const cleanMessage = editingReplyMessage.trim();

      if (!cleanMessage) {
        alert("Reply message cannot be empty.");
        return;
      }

      if (!canModifyReply(createdAt)) {
        alert("This reply can no longer be edited.");
        setEditingReplyId(null);
        setEditingReplyMessage("");
        return;
      }

      const { data: updatedReply, error } = await supabase
      .from("support_ticket_replies")
      .update({
        message: cleanMessage,
      })
      .eq("id", replyId)
      .select("*")
      .single();

      if (error) {
        console.error("Error updating reply:", error);
        alert(error.message);
        return;
      }

      setTicketReplies((prev) =>
      prev.map((reply) =>
        reply.id === replyId
          ? { ...reply, ...updatedReply }
          : reply
      )
    );

      setEditingReplyId(null);
      setEditingReplyMessage("");

      setSuccess("Reply updated successfully!");

      setTimeout(() => {
        setSuccess("");
      }, 2600);
    };

    const handleToggleSavedMessage = async (replyId: string) => {
  if (!currentUserId) {
    alert("User session not found.");
    return;
  }

  const isSaved = savedReplyIds.includes(replyId);

  if (isSaved) {
    const { error } = await supabase
      .from("support_saved_messages")
      .delete()
      .eq("user_id", currentUserId)
      .eq("reply_id", replyId);

    if (error) {
      console.error("Error removing saved message:", error);
      alert(error.message);
      return;
    }

    setSavedReplyIds((prev) =>
      prev.filter((id) => id !== replyId)
    );
  } else {
    const { error } = await supabase
      .from("support_saved_messages")
      .insert({
        user_id: currentUserId,
        reply_id: replyId,
      });

    if (error) {
      console.error("Error saving message:", error);
      alert(error.message);
      return;
    }

    setSavedReplyIds((prev) => [...prev, replyId]);
  }

  setOpenMessageMenuId(null);
};

const handleToggleSavedTicket = async (ticketId: string) => {
  if (!currentUserId) {
    alert("User session not found.");
    return;
  }

  const isSaved = savedTicketIds.includes(ticketId);

  if (isSaved) {
    const { error } = await supabase
      .from("support_saved_messages")
      .delete()
      .eq("user_id", currentUserId)
      .eq("ticket_id", ticketId);

    if (error) {
      console.error("Error removing saved ticket message:", error);
      alert(error.message);
      return;
    }

    setSavedTicketIds((prev) =>
      prev.filter((id) => id !== ticketId)
    );
  } else {
    const { error } = await supabase
      .from("support_saved_messages")
      .insert({
        user_id: currentUserId,
        ticket_id: ticketId,
        reply_id: null,
      });

    if (error) {
      console.error("Error saving ticket message:", error);
      alert(error.message);
      return;
    }

    setSavedTicketIds((prev) => [...prev, ticketId]);
  }

  setOpenMessageMenuId(null);
};

  const handleDeleteReply = async (replyId: string) => {
  const reply = ticketReplies.find((item) => item.id === replyId);

  if (!reply) return;

  if (!canModifyReply(reply.created_at)) {
    alert("This reply can no longer be deleted.");
    return;
  }

    const confirmed = window.confirm(
      "Are you sure you want to delete this reply?"
    );

    if (!confirmed) return;

    const deletedAt = new Date().toISOString();

    const { error } = await supabase
      .from("support_ticket_replies")
      .update({
        deleted_at: deletedAt,
      })
      .eq("id", replyId);

    if (error) {
      console.error("Error deleting reply:", error);
      alert(error.message);
      return;
    }

    setTicketReplies((prev) =>
      prev.map((item) =>
        item.id === replyId
          ? { ...item, deleted_at: deletedAt }
          : item
      )
    );

    setSuccess("Reply deleted successfully!");

    setTimeout(() => {
      setSuccess("");
    }, 2600);
  };

  return (
    <div>
      <PageHeader
        title="Support"
        actions={
          <button
          type="button"
          disabled={hasActiveTicket}
          onClick={() => {
            if (hasActiveTicket) return;
            setIsNewTicketOpen(true);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
            hasActiveTicket
              ? "cursor-not-allowed bg-gray-400 opacity-60"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          title={
            hasActiveTicket
              ? "You already have an active support ticket. Please wait until it is closed."
              : "Create a new support ticket"
          }
        >
          + New Ticket
        </button>
        }
      />
      {isSupportUser && (
  <div className="mb-4 flex flex-wrap gap-2">
    {(Object.entries(counts) as [string, number][]).map(
      ([label, count]) => (
        <span
          key={label}
          className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px]"
        >
          {count} <StatusBadge label={label} />
        </span>
      )
    )}
    </div>
   )}
      {isNewTicketOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-[92vw] max-w-5xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Create Support Ticket
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Describe the issue you need help with.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTicketOpen(false)}
          className="rounded-lg px-3 py-1.5 text-xl text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </div>

        <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Subject
              </label>

              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Enter ticket subject"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Message
              </label>

              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={5}
                placeholder="Describe your issue..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewTicketOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreateTicket}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Create Ticket
                </button>
              </div>
             </div>
           </div>
         )}
      <div className="mt-3 flex h-[calc(100vh-195px)] min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

  {/* LEFT — Support users */}
  <div className="w-[330px] shrink-0 border-r border-gray-200">
    {isSupportUser && (
  <div className="border-b border-gray-200 px-5 py-4">
    <h3
  className="text-sm font-bold"
  style={{ color: "#0f172a" }}
>
  All conversations
</h3>

    <p
  className="mt-1 text-xs"
  style={{ color: "#64748b" }}
>
      {inboxUsers.length} conversations
    </p>
    </div>
    )}

    <div className={
    isSupportUser
      ? "h-[calc(100%-73px)] overflow-y-auto"
      : "h-full overflow-y-auto"
      }
    >
      {inboxUsers.map((item) => {
        const ticket = item;
        const profile = isSupportUser
        ? ticketProfiles[ticket.userId] ?? null
        : ticket.assignedTo
          ? ticketProfiles[ticket.assignedTo] ?? null
          : null;
        const isActive = selectedTicket?.id === ticket.id;

        return (
          <button
            key={ticket.id}
            type="button"
            onClick={() => setSelectedTicket(ticket)}
            className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-4 text-left transition dark:border-slate-800 ${
            isActive
            ? ""
            : "hover:bg-gray-50 dark:hover:bg-slate-800/60"
          }`}
          style={
          isActive
            ? { backgroundColor: "#eef4ff" }
            : undefined
        }
          >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200">
              {getProfileAvatar(profile) ? (
                <img
                  src={getProfileAvatar(profile)}
                  alt={getProfileName(profile)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-700">
                  {getProfileName(profile)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

           <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="truncate text-sm font-semibold"
                style={{
                  color: isActive ? "#111827" : "#111827",
                }}
              >
                {getProfileName(profile)}
              </span>

              {isStaffProfile(profile) && (
                <span className="shrink-0 rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-500">
                  {getProfileRoleLabel(profile)}
                </span>
              )}
            </div>

            <span className="shrink-0 text-[11px] text-gray-400">
              {ticket.lastReply || ticket.created}
            </span>
          </div>

          <p
            className="mt-1 truncate text-xs"
            style={{
              color: isActive ? "#1f2937" : "#6b7280",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            <span style={{ fontWeight: isActive ? 600 : 500 }}>
              {ticket.lastMessageUserId === currentUserId
                ? "Me: "
                : isSupportUser
                  ? `${getProfileName(
                      ticketProfiles[ticket.lastMessageUserId]
                    )}: `
                  : "Support: "}
            </span>

            {ticket.lastMessage}
          </p>
        </div>
          </button>
        );
        })}
      </div>
    </div>

        {/* RIGHT — Conversation যাবে এখানে */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">
        {!selectedTicket ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                Select a conversation
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Choose a user from the left side.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">

            {/* Conversation partner header */}
          <div
  className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-4"
  style={{ opacity: 1 }}
>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 overflow-hidden rounded-full bg-gray-200">
                {getProfileAvatar(conversationPartnerProfile) ? (
                  <img
                    src={getProfileAvatar(conversationPartnerProfile)}
                    alt={getProfileName(conversationPartnerProfile)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-700">
                    {getProfileName(conversationPartnerProfile)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
  className="text-sm font-bold"
  style={{
    color: "#0f172a",
    opacity: 1,
  }}
>
  {conversationPartnerProfile
    ? getProfileName(conversationPartnerProfile)
    : selectedTicket.userId === currentUserId
      ? "Support"
      : getProfileName(ticketUserProfile)}
</span>

                  {conversationPartnerProfile &&
                    isStaffProfile(conversationPartnerProfile) && (
                      <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-500">
                        {getProfileRoleLabel(conversationPartnerProfile)}
                      </span>
                    )}
                </div>

                <p className="text-xs text-gray-500">
                  Support conversation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

            {/* Conversation area */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="w-full space-y-6">

                {/* Original user message */}
                <div
                  id={`ticket-${selectedTicket.id}`} className="flex items-start gap-3 scroll-mt-24 rounded-xl transition-all duration-300">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {getProfileAvatar(initialTicketProfile) ? (
                    <img
                      src={getProfileAvatar(initialTicketProfile)}
                      alt={getProfileName(initialTicketProfile)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-700">
                  {getProfileName(initialTicketProfile).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

      <div className="min-w-0 flex-1">
  <div className="mb-1 flex items-center justify-between gap-4">
    <p
  className="text-sm font-bold"
  style={{ color: "#0f172a" }}
>
  {getProfileName(initialTicketProfile)}
</p>
  <div
  data-message-menu
  className="relative flex items-center gap-2">
    <span className="text-xs text-gray-500">
      {selectedTicket.created}
    </span>

    <button
      type="button"
      onClick={() =>
        setOpenMessageMenuId((prev) =>
          prev === `ticket-${selectedTicket.id}`
            ? null
            : `ticket-${selectedTicket.id}`
        )
      }
      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      aria-label="Message options"
    >
      <MoreHorizontal size={17} />
    </button>

    {openMessageMenuId === `ticket-${selectedTicket.id}` && (
      <div className="absolute right-0 top-8 z-40 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
        <button
          type="button"
          onClick={() => {
            setReplyingTo({
              id: selectedTicket.id,
              message: selectedTicket.message,
              user_id: selectedTicket.userId,
              sourceType: "ticket",
              });

                setOpenMessageMenuId(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                    <Reply size={15} />
                    Reply
                  </button>

                    <button
                    type="button"
                    onClick={() => handleToggleSavedTicket(selectedTicket.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Bookmark size={15} />
                    {savedTicketIds.includes(selectedTicket.id) ? "Unsave" : "Save"}
                  </button>
                    </div>
                    )}
                  </div>
                </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                {/* Conversation replies */}
                {ticketReplies.map((reply) => (
                  <div
                  id={`reply-${reply.id}`}
                  key={reply.id}
                  className={`flex items-start gap-3 scroll-mt-24 rounded-xl transition-all duration-300 ${highlightedReplyId === reply.id ? "bg-blue-50 ring-2 ring-blue-200" : ""}`}
                >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {getProfileAvatar(getReplyProfile(reply)) ? (
                        <img
                          src={getProfileAvatar(getReplyProfile(reply))}
                          alt={getProfileName(getReplyProfile(reply))}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-700">
                          {getProfileName(getReplyProfile(reply)).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-bold"
                              style={{ color: "#0f172a" }}
                            >
                              {getProfileName(getReplyProfile(reply))}
                            </span>

                            {isStaffProfile(getReplyProfile(reply)) && (
                              <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-blue-500">
                                {getProfileRoleLabel(getReplyProfile(reply))}
                              </span>
                            )}
                          </div>

                          {!reply.deleted_at && reply.edited_at && (
                            <span className="text-xs text-gray-500">
                              Edited
                            </span>
                          )}
                        </div>

                        <div className="relative flex shrink-0 items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>

                  {!reply.deleted_at && (
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();

                    const scrollContainer = e.currentTarget.closest(
                      ".overflow-y-auto"
                    ) as HTMLElement | null;

                    const containerRect = scrollContainer?.getBoundingClientRect();

                    const spaceBelow = containerRect
                      ? containerRect.bottom - rect.bottom
                      : window.innerHeight - rect.bottom;

                    const spaceAbove = containerRect
                      ? rect.top - containerRect.top
                      : rect.top;

                    setMessageMenuDirection(
                      spaceBelow < 190 && spaceAbove > spaceBelow
                        ? "up"
                        : "down"
                    );

                    setOpenMessageMenuId((prev) =>
                      prev === reply.id ? null : reply.id
                    );
                  }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Message options"
            >
              <MoreHorizontal size={17} />
            </button>
          )}

          {openMessageMenuId === reply.id && !reply.deleted_at && (
            <div className={`absolute right-0 z-40 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${
              messageMenuDirection === "up"
                ? "bottom-8"
                : "top-8"
            }`}>

      <button
        type="button"
        onClick={() => {
          setReplyingTo({
          ...reply,
          sourceType: "reply",
        });
          setOpenMessageMenuId(null);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <Reply size={15} />
        Reply
      </button>

      <button
      type="button"
      onClick={() => handleToggleSavedMessage(reply.id)}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
    >
      <Bookmark size={15} />
      {savedReplyIds.includes(reply.id) ? "Unsave" : "Save"}
    </button>

      {reply.user_id === currentUserId &&
        canModifyReply(reply.created_at) && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditingReplyId(reply.id);
                setEditingReplyMessage(reply.message);
                setOpenMessageMenuId(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenMessageMenuId(null);
                handleDeleteReply(reply.id);
                 }}
                   className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                        <Trash2 size={15} />
                           Delete
                          </button>
                        </>
                      )}
                  </div>
                )}
              </div>
            </div>
            {(reply.reply_to_id || reply.reply_to_ticket_id) &&
          (() => {
            const isTicketReply = Boolean(reply.reply_to_ticket_id);

            const repliedMessage = isTicketReply
              ? null
              : ticketReplies.find(
                  (item) => item.id === reply.reply_to_id
                );

            if (!isTicketReply && !repliedMessage) return null;

            const targetId = isTicketReply
              ? `ticket-${reply.reply_to_ticket_id}`
              : `reply-${reply.reply_to_id}`;

            const senderName = isTicketReply
              ? getProfileName(ticketUserProfile)
              : getProfileName(getReplyProfile(repliedMessage));

            const quotedMessage = isTicketReply
              ? selectedTicket.message
              : repliedMessage?.deleted_at
              ? "This message was deleted."
              : repliedMessage?.message;

            return (
              <div
                onClick={() => {
                  const target = document.getElementById(targetId);

                  target?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  if (!isTicketReply && reply.reply_to_id) {
                    setHighlightedReplyId(reply.reply_to_id);

                    setTimeout(() => {
                      setHighlightedReplyId(null);
                    }, 1800);
                  }
                }}
                className="mb-2 cursor-pointer rounded-lg border-l-4 border-blue-400 bg-gray-50 px-3 py-2 transition hover:bg-gray-100"
              >
                <p className="text-xs font-semibold text-blue-600">
                  Replying to {senderName}
                </p>

                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {quotedMessage}
                </p>
              </div>
            );
          })()}

              {reply.deleted_at ? (
                <p className="text-sm italic text-gray-500">  
                  This message was deleted.
                </p>
              ) : editingReplyId === reply.id ? (
                <div className="mt-2">
                  <textarea
                    value={editingReplyMessage}
                    onChange={(e) => setEditingReplyMessage(e.target.value)}
                    rows={1}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />

                  <div className="mt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReplyId(null);
                        setEditingReplyMessage("");
                      }}
                      className="text-xs font-semibold text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateReply(reply.id, reply.created_at)
                      }
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {reply.message}
                </p>
              )}
            </div>
          </div>
                ))}
                  <div ref={conversationEndRef} />
              </div>
            </div>

            {/* Message composer */}
            <div className="bg-white px-5 pt-3 pb-1">
              <div className="w-full">
                <div ref={emojiPickerRef} className="relative">
                  {replyingTo && (
              <div className="mb-3 flex items-start justify-between gap-4 rounded-lg border-l-4 border-blue-500 bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-600">
                    Replying to {getProfileName(getReplyProfile(replyingTo))}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-600">
                    {replyingTo.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="shrink-0 text-lg leading-none text-gray-400 hover:text-gray-700"
                  aria-label="Cancel reply"
                >
                  ×
                </button>
              </div>
            )}
          <textarea className="h-11 w-full resize-none rounded-xl border border-gray-300 px-4 py-[11px] pr-14 text-sm leading-5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
            value={replyMessage}
            ref={replyInputRef}
              disabled={selectedTicket.status === "Closed"}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    if (replyMessage.trim()) {
                      handleSubmitReply();
                    }
                  }
                }}
                  rows={1}
                    placeholder={
                      selectedTicket.status === "Closed"
                        ? "This ticket is closed."
                        : "Type a message..."
                          }
                        />
                </div>
              </div>
            </div>

            {/* Controls — সব message box-এর নিচে */}
          <div className="bg-white px-6 py-2">
            <div className="flex w-full items-center gap-2">

              
                <div ref={emojiPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  title="Emoji"
                  aria-label="Emoji"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                >
                  <Smile size={18} />
                </button>

                {showEmojiPicker && (
                <div className="support-emoji-picker absolute bottom-10 left-0 z-50">
              <EmojiPicker
                width={300}
                height={390}
                searchPlaceHolder="Search"
                previewConfig={{
                  showPreview: false,
                }}
                lazyLoadEmojis={true}
                onEmojiClick={(emojiData) => {
                setReplyMessage((prev) => prev + emojiData.emoji);
                setShowEmojiPicker(false);
              }}
              />
                </div>
              )}
              </div>
              {isSupportUser && (
              <>
              <div className="mx-1 h-5 w-px bg-gray-200" />
                  {/* Status */}
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    title="Change status"
                  >
                    <CircleDot size={17} />

                    <select
                      aria-label="Change ticket status"
                      value={
                        selectedTicket.status === "In Progress"
                          ? "in_progress"
                          : selectedTicket.status === "On Hold"
                          ? "on_hold"
                          : selectedTicket.status.toLowerCase()
                      }
                      onChange={(e) =>
                        handleUpdateTicketStatus(e.target.value)
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="answered">Answered</option>
                      <option value="on_hold">On Hold</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="mx-1 h-5 w-px bg-gray-200" />

                  {/* Priority */}
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    title="Change priority"
                  >
                    <Flag size={17} />

                    <select
                      aria-label="Change ticket priority"
                      value={selectedTicket.priority.toLowerCase()}
                      onChange={(e) =>
                        handleUpdateTicketPriority(e.target.value)
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </>
              )}

              <div className="ml-auto flex items-center gap-2">
                {isSupportUser && (
                  <button
                    type="button"
                    onClick={handleDeleteTicket}
                    title="Delete ticket"
                    aria-label="Delete ticket"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={17} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmitReply}
                  title="Send message"
                  disabled={selectedTicket.status === "Closed"}
                  aria-label="Send message"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <SendHorizontal size={16} />
                </button>
                </div>
            </div>
          </div>
        </div>
        )}
          </div>
            </div>
      {success && (
        <div className="toast-card-motion fixed bottom-6 right-6 z-[100] w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              Ticket Created
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {success}
            </p>
          </div>

          <div className="toast-progress h-[3px] w-full bg-green-500" />
        </div>
      )}
      {liveNotification && (
  <div
    className="toast-card-motion fixed bottom-6 right-6 z-[120] w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900"
  >
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
      {liveNotification.senderAvatar ? (
        <img
          src={liveNotification.senderAvatar}
          alt={liveNotification.senderName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-600 dark:text-slate-200">
          {liveNotification.senderName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
          <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">
            {liveNotification.senderName}
          </p>

          <span className="text-[10px] text-gray-400 dark:text-slate-500">
            {formatToastTime(liveNotification.createdAt)}
          </span>
        </div>

          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-slate-100">
            {liveNotification.title}
          </p>
        </div>

          <button
            type="button"
            onClick={() => setLiveNotification(null)}
            className="shrink-0 text-lg leading-none text-gray-400 transition hover:text-gray-700 dark:hover:text-slate-200"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600 dark:text-slate-300">
          {liveNotification.message}
        </p>

        {liveNotification.ticketId && (
          <button
            type="button"
            onClick={() => {
              window.location.href = `/support?ticket=${liveNotification.ticketId}`;
              setLiveNotification(null);
            }}
            className="mt-2 text-xs font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400"
          >
            Open conversation
          </button>
        )}
      </div>
    </div>

    <div className="toast-progress h-[3px] w-full bg-blue-500" />
  </div>
)}
    </div>
  );
}
