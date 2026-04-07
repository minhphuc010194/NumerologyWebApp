/**
 * Local In-Memory Rate Limiter
 * Hoạt động tốt trên Node.js memory để chặn basic spam.
 */

// Lưu trữ token rate limit theo IP
interface RateLimitData {
  count: number;
  resetTime: number;
}

// Biến global để giữ state qua các lần hot-reload và tái sử dụng lambda
const globalStore = global as any;
if (!globalStore.rateLimitCache) {
  globalStore.rateLimitCache = new Map<string, RateLimitData>();
}
const cache: Map<string, RateLimitData> = globalStore.rateLimitCache;

/**
 * Kiểm tra giới hạn số lượng request.
 * Tự động xoá các IP đã hết hạn khỏi memory để tối ưu RAM.
 *
 * @param ip  - IP của người dùng
 * @param limit - Số request tối đa
 * @param windowMs - Khoảng thời gian (ms) reset
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 10000 // 10 giây default
) {
  const now = Date.now();

  // Dọn dẹp memory trước (chỉ giữ lại những IP chưa hết hạn)
  // Thực tế ở quy mô nhỏ có thể chạy mỗi vòng loop, ở quy mô lớn có thể tách ra tác vụ riêng.
  cache.forEach((data, key) => {
    if (now > data.resetTime) {
      cache.delete(key);
    }
  });

  // Khởi tạo state nếu chưa có IP
  if (!cache.has(ip)) {
    cache.set(ip, {
      count: 0,
      resetTime: now + windowMs
    });
  }

  const currentData = cache.get(ip)!;

  // Cập nhật lượt gọi
  currentData.count += 1;
  const remaining = Math.max(0, limit - currentData.count);
  const success = currentData.count <= limit;

  // Lấy thời giam reset
  const resetTimestamp = currentData.resetTime;

  return {
    success,
    limit,
    remaining,
    reset: resetTimestamp
  };
}
