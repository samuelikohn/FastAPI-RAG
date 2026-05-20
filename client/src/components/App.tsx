import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import NavBar from "../components/NavBar"
import ChatPage from "../pages/Chat"
import SearchPage from "../pages/Search"
import UploadPage from "../pages/Upload"

export default function App() {
	return (
		<BrowserRouter>
			<div className="flex flex-col h-screen">
				<NavBar />
				<main className="flex-1 overflow-hidden">
					<Routes>
						<Route
							path="/"
							element={<Navigate to="/upload" replace />}
						/>
						<Route path="/upload" element={<UploadPage />} />
						<Route path="/chat" element={<ChatPage />} />
						<Route path="/search" element={<SearchPage />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	)
}
