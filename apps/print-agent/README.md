# print-agent ⏸ 5단계에서 구현 예정

매장 PC에 상주하며 ESC/POS 열전사 프린터로 주방표·영수증을 출력하는 Node.js 데몬.

> 클라우드 배포 X — 매장 내부 PC에 설치되어 LAN으로 프린터를 제어합니다.

## 설계 요약

자세한 스펙은 루트 [BACKLOG.md](../../BACKLOG.md) 5단계 참고.

핵심:
- API 서버와 Socket.IO로 연결, `print.job.created` 구독
- `node-thermal-printer` 사용
- 프린터 설정은 `config/printers.json`으로 분리 (기종 교체 시 코드 수정 X)
- 인쇄 실패 시 재시도 큐 + 백오프
