export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired'
export type AssetCondition = 'new' | 'good' | 'fair' | 'poor'

export type Asset = {
  id: string
  asset_tag: string
  name: string
  brand: string | null
  model: string | null
  status: AssetStatus
  condition: AssetCondition
  purchase_price: number | null
  warranty_expiry: string | null
  categories: { name: string } | null
  locations: { name: string } | null
}   