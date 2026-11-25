export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired'
export type AssetCondition = 'new' | 'good' | 'fair' | 'poor'

export type Option = {
  id: string
  name: string
}

export type Asset = {
  id: string
  asset_tag: string
  name: string
  category_id: string
  brand: string | null
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_price: number | null
  warranty_expiry: string | null
  location_id: string
  condition: AssetCondition
  status: AssetStatus
  notes: string | null
  categories: { name: string } | null
  locations: { name: string } | null
}

export type EmployeeStatus = 'active' | 'inactive'

export type EmployeeAssignment = {
  id: string
  assigned_at: string
  returned_at: string | null
  assets: { asset_tag: string; name: string } | null
}

export type Employee = {
  id: string
  employee_code: string
  full_name: string
  email: string
  job_title: string | null
  department_id: string
  location_id: string
  status: EmployeeStatus
  departments: { name: string } | null
  locations: { name: string } | null
  assignments: EmployeeAssignment[]
}

export type Assignment = {
  id: string
  asset_id: string
  employee_id: string
  assigned_at: string
  returned_at: string | null
  notes: string | null
  assets: { asset_tag: string; name: string } | null
  employees: { employee_code: string; full_name: string } | null
}

export type AssetOption = {
  id: string
  asset_tag: string
  name: string
}

export type EmployeeOption = {
  id: string
  employee_code: string
  full_name: string
}