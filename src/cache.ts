// 아주 가벼운 인메모리 TTL 캐시.
// 핵심 원칙: API를 "사용자 요청마다"가 아니라 "소스마다 주기적으로" 호출 → 비용을 사용자 수와 분리.
// (운영 배포 시 이 부분만 KV/Redis로 교체하면 됨)

interface Entry<T> { value: T; expires: number; }
const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string, ttlMs: number, loader: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}
