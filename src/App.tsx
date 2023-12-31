import './App.css'
import {MainPage} from './pages/main-page';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFoundPage from './pages/not-found-page';
import {SubMainPage} from '@/pages/sub-main-page';

function App() {
    return <BrowserRouter>
        <Routes>
            <Route path='vite-sandbox/' element={<MainPage />} />
            <Route path='vite-sandbox/sub' element={<SubMainPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
}

export default App;
