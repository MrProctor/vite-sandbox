import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import StoreProvider from './pages/web-rtc-example/StoreProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StoreProvider><App /></StoreProvider>
)
