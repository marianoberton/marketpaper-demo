-- Create chatbot_contacts table
CREATE TABLE chatbot_contacts (
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (wa_id, company_id)
);

-- Enable RLS for chatbot_contacts
ALTER TABLE chatbot_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for chatbot_contacts
CREATE POLICY "Users can view their company chatbot contacts"
ON chatbot_contacts FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can create chatbot contacts for their company"
ON chatbot_contacts FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can update their company chatbot contacts"
ON chatbot_contacts FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can delete their company chatbot contacts"
ON chatbot_contacts FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Create chatbot_analytics table
CREATE TABLE chatbot_analytics (
    id BIGSERIAL PRIMARY KEY,
    wa_id TEXT NOT NULL,
    company_id UUID NOT NULL,
    message_id TEXT NOT NULL,
    intent TEXT,
    flow_executed TEXT,
    response_type TEXT,
    response_sent BOOLEAN,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (wa_id, company_id) REFERENCES chatbot_contacts(wa_id, company_id) ON DELETE CASCADE
);

-- Enable RLS for chatbot_analytics
ALTER TABLE chatbot_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for chatbot_analytics
CREATE POLICY "Users can view their company chatbot analytics"
ON chatbot_analytics FOR SELECT
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can create chatbot analytics for their company"
ON chatbot_analytics FOR INSERT
WITH CHECK (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can update their company chatbot analytics"
ON chatbot_analytics FOR UPDATE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can delete their company chatbot analytics"
ON chatbot_analytics FOR DELETE
USING (
    public.is_super_admin() OR
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- Add indexes
CREATE INDEX idx_chatbot_contacts_company_id ON chatbot_contacts(company_id);
CREATE INDEX idx_chatbot_analytics_company_id ON chatbot_analytics(company_id);
CREATE INDEX idx_chatbot_analytics_wa_id_company_id ON chatbot_analytics(wa_id, company_id);
CREATE INDEX idx_chatbot_analytics_created_at ON chatbot_analytics(created_at); 