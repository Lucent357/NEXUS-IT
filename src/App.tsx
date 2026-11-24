import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Category = {
  id: string
  name: string
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (error) {
        setError(error.message)
        return
      }
      setCategories(data ?? [])
    }

    getCategories()
  }, [])

  if (error) return <p>Error: {error}</p>

  return (
    <ul>
      {categories.map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  )
}