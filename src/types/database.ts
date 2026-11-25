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