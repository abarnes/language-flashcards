import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { ListDetail } from '@/pages/ListDetail'
import { Study } from '@/pages/Study'
import { Settings } from '@/pages/Settings'
import { Upload } from '@/pages/Upload'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/list/:id" element={<ListDetail />} />
          <Route path="/study" element={<Study />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
