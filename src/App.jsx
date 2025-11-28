import './App.css'
import Pages from "@/pages/index.jsx"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Pages />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App 