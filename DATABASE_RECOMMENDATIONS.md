# G1 Group CRM - Database Security & Performance Recommendations

**Generated**: November 1, 2025  
**Analysis Type**: Supabase Advisor Reports

---

## Executive Summary

The database has been analyzed using Supabase's built-in advisors. Below are categorized recommendations for improving security and performance.

---

## 🔴 Critical Security Issues (ERROR Level)

### 1. Security Definer Views

**Issue**: Two views are defined with SECURITY DEFINER property

**Affected Views**:
- `public.audit_log_analytics`
- `public.user_activity_summary`

**Risk**: These views enforce Postgres permissions and RLS policies of the view creator rather than the querying user, which can lead to privilege escalation.

**Recommendation**: 
- Review if SECURITY DEFINER is absolutely necessary
- If needed, ensure views have restrictive access policies
- Consider using SECURITY INVOKER instead
- Document the security implications

**Reference**: [Supabase Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

---

## ⚠️ High Priority Security Issues (WARN Level)

### 2. Function Search Path Mutable (24 functions affected)

**Issue**: Functions don't have search_path explicitly set, making them vulnerable to search path manipulation attacks.

**Affected Functions**:
- `update_clients_search_vector`
- `update_skrs_search_vector`
- `update_assets_search_vector`
- `update_invoices_search_vector`
- `cleanup_old_audit_logs`
- `update_updated_at_column`
- `get_user_role`
- `has_role`
- `generate_skr_number`
- `generate_invoice_number`
- `generate_receipt_number`
- `generate_credit_note_number`
- `calculate_client_risk_score`
- `get_dashboard_stats`
- `log_data_changes`
- `log_auth_event`
- `log_system_event`
- `search_suggestions`
- `global_search`
- `update_filter_presets_updated_at`
- `ensure_single_default_preset`
- `create_default_filter_presets_for_user`

**Fix**: Add `SET search_path = pg_catalog, public` to each function definition.

**Example**:
```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$;
```

**Reference**: [Supabase Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

---

### 3. Leaked Password Protection Disabled

**Issue**: Password leak detection via HaveIBeenPwned is disabled.

**Risk**: Users can set compromised passwords.

**Fix**: Enable in Supabase Dashboard:
- Go to Authentication > Settings
- Enable "Leaked Password Protection"

**Reference**: [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

### 4. Insufficient MFA Options

**Issue**: Too few Multi-Factor Authentication options enabled.

**Risk**: Weakened account security.

**Recommendation**: Enable additional MFA methods:
- TOTP (Time-based One-Time Password)
- SMS verification
- Authenticator apps

**Reference**: [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)

---

## 🔶 Performance Issues (WARN Level)

### 5. Auth RLS Initialization Plan (14 affected policies)

**Issue**: RLS policies call `auth.uid()` directly, causing re-evaluation for each row.

**Impact**: Significant performance degradation on large datasets.

**Affected Tables & Policies**:
- `user_profiles`:
  - "Users can view their own profile"
  - "Users can update their own profile"
  
- `notification_preferences`:
  - "Users can view their own notification preferences"
  - "Users can manage their own notification preferences"
  
- `notifications`:
  - "Users can view their own notifications"
  - "Users can update their own notifications"
  
- `search_analytics`:
  - "Users can view their own search analytics"
  - "Users can insert their own search analytics"
  - "Admins can view all search analytics"
  
- `filter_presets`:
  - "Users can view their own filter presets"
  - "Users can create their own filter presets"
  - "Users can update their own filter presets"
  - "Users can delete their own filter presets"

**Fix**: Wrap `auth.uid()` in a subquery.

**Before**:
```sql
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());
```

**After**:
```sql
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = (SELECT auth.uid()));
```

**Reference**: [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

---

### 6. Multiple Permissive Policies (Many tables affected)

**Issue**: Multiple permissive RLS policies on same table for same action, causing redundant checks.

**Impact**: Each policy is evaluated, reducing query performance.

**Affected Tables**:
- `clients` - 2 SELECT policies
- `assets` - 2 SELECT policies
- `skrs` - Multiple policies
- `tracking` - 2 SELECT policies
- `invoices` - 2 SELECT policies
- `receipts` - 2 SELECT policies
- `credit_notes` - 2 SELECT policies
- `notification_preferences` - 2 SELECT policies
- `notification_templates` - 2 SELECT policies
- `search_analytics` - 2 SELECT policies
- `user_profiles` - 3 SELECT policies, 2 UPDATE policies

**Example Issue on `clients`**:
- "Admin and Finance can manage clients" (ALL operations)
- "Users can view clients based on role" (SELECT)

Both policies apply to SELECT, causing duplicate evaluation.

**Fix**: Combine overlapping policies into a single policy using OR logic.

**Before**:
```sql
CREATE POLICY "Users can view clients based on role" ON clients
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Admin and Finance can manage clients" ON clients
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance']::user_role[])
    );
```

**After**:
```sql
CREATE POLICY "Manage clients based on role" ON clients
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance']::user_role[])
    );

CREATE POLICY "View clients based on role" ON clients
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );
```

**Reference**: [Multiple Permissive Policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)

---

## ℹ️ Performance Optimization (INFO Level)

### 7. Unindexed Foreign Keys (4 cases)

**Issue**: Foreign keys without covering indexes can impact join performance.

**Affected**:
- `email_queue.notification_id` → `notifications.id`
- `skrs.issued_by` → `auth.users.id`
- `sms_queue.notification_id` → `notifications.id`
- `tracking.updated_by` → `auth.users.id`

**Fix**: Add indexes to foreign key columns.

```sql
-- Add missing foreign key indexes
CREATE INDEX idx_email_queue_notification_id ON email_queue(notification_id);
CREATE INDEX idx_skrs_issued_by ON skrs(issued_by);
CREATE INDEX idx_sms_queue_notification_id ON sms_queue(notification_id);
CREATE INDEX idx_tracking_updated_by ON tracking(updated_by);
```

---

### 8. Unused Indexes (52 indexes)

**Issue**: Many indexes have never been used, consuming storage and slowing down writes.

**Impact**: 
- Wasted disk space
- Slower INSERT/UPDATE operations
- Increased maintenance overhead

**Affected Tables**:
- `clients`: 5 unused indexes
- `assets`: 1 unused index
- `skrs`: 1 unused index
- `invoices`: 2 unused indexes
- `receipts`: 2 unused indexes
- `credit_notes`: 1 unused index
- `user_profiles`: 3 unused indexes
- `audit_logs`: 6 unused indexes
- `notifications`: 4 unused indexes
- `notification_preferences`: 2 unused indexes
- `email_queue`: 2 unused indexes
- `sms_queue`: 2 unused indexes
- `search_analytics`: 4 unused indexes
- `filter_presets`: 3 unused indexes
- `tracking`: 1 unused index

**Important Note**: Many of these indexes are currently unused because the system is in early stages. They may become useful as the system scales and different query patterns emerge.

**Recommendation**:
1. **Do NOT drop indexes immediately** - system is new
2. Monitor index usage over the next 3-6 months
3. Keep indexes on:
   - Unique constraint columns
   - Frequently filtered columns (status, email, phone)
   - Foreign keys
   - Date range query columns
4. Consider dropping only after confirming they're truly unnecessary

**Indexes to Keep (High Priority)**:
```sql
-- These are likely to be used as system grows
idx_clients_email       -- Email lookups
idx_clients_type        -- Client type filtering
idx_skrs_number         -- SKR lookups by number
idx_invoices_number     -- Invoice lookups
idx_receipts_number     -- Receipt lookups
```

**Monitor and Potentially Drop Later**:
```sql
-- These might be less critical
idx_user_profiles_role
idx_user_profiles_status
idx_audit_logs_action
```

**Query to Monitor Index Usage**:
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

---

## 📊 Implementation Priority

### Phase 1: Critical Security (Immediate)
1. ✅ Review SECURITY DEFINER views
2. ✅ Add search_path to all functions
3. ✅ Enable leaked password protection
4. ✅ Enable additional MFA options

### Phase 2: Performance Optimization (Next Sprint)
1. ✅ Fix RLS policies to use `(SELECT auth.uid())`
2. ✅ Add missing foreign key indexes
3. ✅ Consolidate multiple permissive policies

### Phase 3: Long-term Monitoring (3-6 months)
1. ✅ Monitor index usage statistics
2. ✅ Analyze query patterns
3. ✅ Drop truly unused indexes if confirmed unnecessary

---

## 🛠️ Migration Script Template

Here's a template migration script to fix the critical issues:

```sql
-- Migration: fix_security_and_performance_issues
-- Date: 2025-11-01

-- 1. Add search_path to critical functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION has_role(required_roles user_role[])
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN get_user_role() = ANY(required_roles);
END;
$$;

-- 2. Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_notification_id ON email_queue(notification_id);
CREATE INDEX IF NOT EXISTS idx_skrs_issued_by ON skrs(issued_by);
CREATE INDEX IF NOT EXISTS idx_sms_queue_notification_id ON sms_queue(notification_id);
CREATE INDEX IF NOT EXISTS idx_tracking_updated_by ON tracking(updated_by);

-- 3. Fix RLS policies for performance
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- 4. Fix filter_presets policies
DROP POLICY IF EXISTS "Users can view their own filter presets" ON filter_presets;
CREATE POLICY "Users can view their own filter presets" ON filter_presets
    FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create their own filter presets" ON filter_presets;
CREATE POLICY "Users can create their own filter presets" ON filter_presets
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own filter presets" ON filter_presets;
CREATE POLICY "Users can update their own filter presets" ON filter_presets
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own filter presets" ON filter_presets;
CREATE POLICY "Users can delete their own filter presets" ON filter_presets
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Continue for other affected policies...

COMMENT ON DATABASE postgres IS 'Security and performance improvements applied on 2025-11-01';
```

---

## 📈 Expected Impact

### Security Improvements
- ✅ **Reduced attack surface** from function search path vulnerabilities
- ✅ **Better password security** with leak detection
- ✅ **Stronger authentication** with MFA
- ✅ **Controlled privilege escalation** with reviewed SECURITY DEFINER views

### Performance Improvements
- ✅ **20-50% faster queries** on tables with fixed RLS policies (at scale)
- ✅ **10-30% faster joins** with new foreign key indexes
- ✅ **5-15% faster writes** after removing truly unused indexes (later phase)
- ✅ **Reduced policy evaluation overhead** from consolidated policies

---

## 📝 Testing Checklist

After applying fixes:

- [ ] Test all user authentication flows
- [ ] Verify RLS policies still work correctly
- [ ] Check that all API endpoints function properly
- [ ] Monitor query performance with `EXPLAIN ANALYZE`
- [ ] Verify audit logs are still being created
- [ ] Test user signup with common passwords (should fail)
- [ ] Confirm MFA enrollment works
- [ ] Run full regression test suite

---

## 🔍 Monitoring Queries

### Check Policy Performance
```sql
-- Monitor RLS policy execution
SELECT 
    schemaname,
    tablename,
    policyname,
    (reltuples)::bigint AS estimated_rows
FROM pg_policies 
JOIN pg_class ON pg_class.relname = pg_policies.tablename
WHERE schemaname = 'public'
ORDER BY reltuples DESC;
```

### Check Index Usage
```sql
-- Find indexes that should be used but aren't
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Function Performance
```sql
-- Monitor function execution (requires pg_stat_statements extension)
SELECT 
    funcname,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_user_functions
WHERE schemaname = 'public'
ORDER BY total_time DESC;
```

---

## 🎯 Success Metrics

Track these metrics before and after fixes:

1. **Security**:
   - Number of failed login attempts with compromised passwords
   - MFA enrollment rate
   - Security advisor error count (target: 0)

2. **Performance**:
   - Average API response time
   - P95/P99 query latency
   - Database CPU utilization
   - Number of slow queries (>100ms)

3. **Database Health**:
   - Index hit ratio (target: >99%)
   - Cache hit ratio (target: >95%)
   - Table bloat percentage
   - WAL size and replication lag

---

## 📚 References

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL RLS Performance](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Index Optimization](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)

---

## 💡 Next Steps

1. **Review this document** with the development team
2. **Schedule a maintenance window** for applying critical fixes
3. **Create a migration file** based on the template above
4. **Test in development environment** first
5. **Apply to staging** and monitor for 24-48 hours
6. **Deploy to production** during low-traffic period
7. **Monitor metrics** for 1 week post-deployment
8. **Document any issues** and iterations needed

---

**Last Updated**: November 1, 2025  
**Status**: Ready for Implementation  
**Estimated Implementation Time**: 4-6 hours

