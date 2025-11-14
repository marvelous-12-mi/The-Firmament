// js/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qpfjchiucjhfvyohqhih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZmpjaGl1Y2poZnZ5b2hxaGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDczMjksImV4cCI6MjA3NTQ4MzMyOX0.kcx9Sr7qGbWudJdf155tXg0gWWX6P1RYavo-lKCoQkU';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY in js/supabaseClient.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
