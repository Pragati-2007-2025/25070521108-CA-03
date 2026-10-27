import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './auth/Login.jsx';
import Register from './auth/Register.jsx';
import Shop from './shop/Shop.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shop />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/category/:category" element={<Shop />} />
      <Route path="/search" element={<Shop />} />
      <Route path="/deals" element={<Shop />} />
      <Route path="/about" element={<Shop />} />
      <Route path="/product/:productId" element={<Shop />} />
      <Route path="/welcome" element={<Navigate to="/shop" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
