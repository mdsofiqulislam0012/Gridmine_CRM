"use client";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import NewRecordButton from "@/components/ui/NewRecordButton";
import { tickets } from "@/data/tickets";
import { Column, Ticket } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";


export default function SupportPage() {
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);
  const supabase = useMemo(() => createClient(), []);

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

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [success, setSuccess] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyMessage, setEditingReplyMessage] = useState("");
  useEffect(() => {
  const loadSupportTickets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading support tickets:", error);
      return;
    }

    const formattedTickets = (data ?? []).map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
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
}, [supabase]);
  const handleCreateTicket = async () => {
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

      setSuccess("Reply sent successfully!");

      setTimeout(() => {
        setSuccess("");
      }, 2600);
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
            onClick={() => setIsNewTicketOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + New Ticket
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
          <span key={label} className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-[13px]">
            {count} <StatusBadge label={label} />
          </span>
        ))}
      </div>
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
      <DataTable columns={columns} rows={supportTickets} searchKeys={["subject", "contact"]} selectable bulkActions />
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-[92vw] max-w-5xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl">
            <div className="sticky top-0 z-20 -mx-7 mb-6 flex items-start justify-between border-b border-gray-200 bg-white px-7 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Ticket Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  #{selectedTicket.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg px-3 py-1.5 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Subject
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {selectedTicket.subject}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Status
                  </p>

                  <select
                    value={
                      selectedTicket.status === "In Progress"
                        ? "in_progress"
                        : selectedTicket.status === "On Hold"
                        ? "on_hold"
                        : selectedTicket.status.toLowerCase()
                    }
                    onChange={(e) => handleUpdateTicketStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="answered">Answered</option>
                    <option value="on_hold">On Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Priority
                  </p>

                  <select
                    value={selectedTicket.priority.toLowerCase()}
                    onChange={(e) => handleUpdateTicketPriority(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Message
                </p>

                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Reply History
                </p>

                <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {ticketReplies.length === 0 ? (
                    <p className="text-sm text-gray-500">No replies yet.</p>
                  ) : (
                    ticketReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {reply.deleted_at ? (
                          <p className="text-sm italic text-gray-500">
                            This message was deleted.
                          </p>
                        ) : editingReplyId === reply.id ? (
                          <div className="w-full">
                            <textarea
                              value={editingReplyMessage}
                              onChange={(e) => setEditingReplyMessage(e.target.value)}
                              rows={3}
                              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />

                            <div className="mt-2 flex justify-end gap-2">
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
                                onClick={() => handleUpdateReply(reply.id, reply.created_at)}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm text-gray-700">
                            {reply.message}
                          </p>
                        )}
                          {!reply.deleted_at && canModifyReply(reply.created_at) && (
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReplyId(reply.id);
                                  setEditingReplyMessage(reply.message);
                                }}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReply(reply.id)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(reply.created_at).toLocaleString()}</span>

                        {!reply.deleted_at && reply.edited_at && (
                          <span className="font-medium">Edited</span>
                        )}
                      </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Reply
                </p>

                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  placeholder="Write a reply..."
                  className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitReply}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Send Reply
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Created
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {selectedTicket.created}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDeleteTicket}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Ticket
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
    </div>
  );
}
