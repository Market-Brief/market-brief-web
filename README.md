# Market Brief Web

Giao diện nghiên cứu. Trang đọc API .NET `market-brief-api`. Trình duyệt không gọi DNSE, VCI hay KBS.

API mặc định là `http://127.0.0.1:8080`. `/login` và `/register` tạo phiên. Access token nằm trong `sessionStorage`. Refresh token là cookie `mb_refresh`. Trang `/` gọi `GET /dashboard`. Trang `/integrations` hiện cấu hình Slack: kênh, lệnh, và token đã đặt hay chưa.

## Stack

| Phần | Công cụ |
|---|---|
| UI | React 19, TypeScript |
| Dev server | Vite |
| Style | Tailwind CSS |
| Dữ liệu server | TanStack Query |
| Route | React Router |
| Biểu đồ nến, khi có OHLC | lightweight-charts |

Đây là bộ SPA mà dev dùng nhiều khi backend đã có sẵn. Next.js phổ biến hơn nếu frontend tự giữ server. Ở đây Python giữ dữ liệu và MySQL, nên thêm một server Next là thừa.

## Chạy

```bash
cd /Users/sangtruongthanh/Documents/2026/market-brief-web
npm install
npm run dev
```

Mở địa chỉ Vite in ra, thường là `http://127.0.0.1:5173`.

Đổi URL API bằng cách copy `.env.example` thành `.env` và sửa `VITE_API_URL`.
