-- Add ticket_id to notifications table for ticket-related notifications
-- This allows users to receive in-app notifications when admin responds to their tickets

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE;

-- Create index for efficient ticket notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_ticket ON notifications(ticket_id);

-- Add comment for documentation
COMMENT ON COLUMN notifications.ticket_id IS 'Reference to support ticket for ticket-related notifications (ticket_response, ticket_waiting)';
