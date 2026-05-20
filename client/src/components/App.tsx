import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import ChatPage from "../pages/Chat"
import SearchPage from "../pages/Search"
import UploadPage from "../pages/Upload"

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to="/upload" replace />} />
				<Route path="/upload" element={<UploadPage />} />
				<Route path="/chat" element={<ChatPage />} />
				<Route path="/search" element={<SearchPage />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
