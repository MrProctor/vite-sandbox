import './styles/normalize.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFoundPage from './pages/not-found-page';
import WebRTCChat from '@/pages/web-rtc-example';

function App() {
    return <BrowserRouter>
        <Routes>
            <Route path='/' element={<WebRTCChat />} />
            <Route path='vite-sandbox/' element={<WebRTCChat />} />
            {/*<Route path='vite-sandbox/sub' element={<SubMainPage />} />*/}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
}

export default App;
