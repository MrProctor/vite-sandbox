import './App.css'
import {MainPage} from './pages/main-page';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFoundPage from './pages/not-found-page';

function App() {
    return <BrowserRouter>
        <Routes>
            <Route path='/' element={<MainPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
}

export default App;
