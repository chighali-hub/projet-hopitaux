import { useState } from 'react'

function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = value.trim()
    if (!query) return
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <form className="searchbar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="searchbar-input"
        placeholder="Ex: Paracétamol, Ibuprofène..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="searchbar-button" disabled={loading}>
        {loading ? 'Recherche...' : 'Rechercher'}
      </button>
    </form>
  )
}

export default SearchBar


