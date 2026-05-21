export type UserRole = 'admin' | 'employee'

export type SessionStatus = 'not_started' | 'in_progress' | 'completed'

export interface SessionReportRow {
  id: string
  session_date: string
  status: SessionStatus
  started_at: string | null
  completed_at: string | null
  store_name: string
  checklist_title: string
  created_by_name: string | null
  total_items: number
  checked_items: number
}

export interface AuditItemRow {
  item_id: string
  label: string
  sort_order: number
  is_checked: boolean
  checked_at: string | null
  checked_by_name: string | null
}

// Convenience interfaces for use throughout the app
export interface Store {
  id: string
  name: string
  code: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  store_id: string | null
  is_active: boolean
  deleted_at: string | null
  invited_at: string | null
  created_at: string
  updated_at: string
}

export type EmployeeStatus = 'active' | 'disabled' | 'deleted'

/** Profile row enriched with the store name — used in the employee list UI */
export interface EmployeeRow extends Profile {
  store_name: string | null
}

export interface Checklist {
  id: string
  title: string
  description: string | null
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ChecklistStoreAssignment {
  id: string
  checklist_id: string
  store_id: string
  assigned_at: string
  assigned_by: string | null
}

export interface ChecklistSession {
  id: string
  store_id: string
  checklist_id: string
  session_date: string
  status: SessionStatus
  started_at: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItemCheck {
  id: string
  session_id: string
  checklist_item_id: string
  is_checked: boolean
  checked_at: string | null
  checked_by: string | null
  updated_at: string
}

// Database type in supabase-generated format (required for proper type inference)
export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          code: string
          timezone: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          store_id: string | null
          is_active: boolean
          deleted_at: string | null
          invited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: string
          store_id?: string | null
          is_active?: boolean
          deleted_at?: string | null
          invited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          store_id?: string | null
          is_active?: boolean
          deleted_at?: string | null
          invited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          id: string
          title: string
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          checklist_id: string
          label: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          checklist_id: string
          label: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          checklist_id?: string
          label?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      checklist_store_assignments: {
        Row: {
          id: string
          checklist_id: string
          store_id: string
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: string
          checklist_id: string
          store_id: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: string
          checklist_id?: string
          store_id?: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Relationships: []
      }
      checklist_sessions: {
        Row: {
          id: string
          store_id: string
          checklist_id: string
          session_date: string
          status: 'not_started' | 'in_progress' | 'completed'
          started_at: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          checklist_id: string
          session_date: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          checklist_id?: string
          session_date?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_item_checks: {
        Row: {
          id: string
          session_id: string
          checklist_item_id: string
          is_checked: boolean
          checked_at: string | null
          checked_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          checklist_item_id: string
          is_checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          checklist_item_id?: string
          is_checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
