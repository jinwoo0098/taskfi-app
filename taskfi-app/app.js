// app.js
document.addEventListener("DOMContentLoaded", () => {
  const usernameElement = document.getElementById("username");
  const swapButton = document.querySelector(".swap-card .secondary-btn");
  
  let isAuthenticated = false;

  // 1. Pi SDK 초기화 (오픈 메인넷 통신을 위해 sandbox: false 유지)
  try {
    Pi.init({ version: "2.0", sandbox: false });
    
    usernameElement.textContent = "여기를 터치하여 로그인";
    usernameElement.style.color = "#FFD700"; 
    usernameElement.style.textDecoration = "underline";
    usernameElement.style.cursor = "pointer";
  } catch (err) {
    window.alert("Pi SDK 초기화 에러: " + err.message);
    return;
  }

  // ★ 필수 콜백 함수를 밖으로 분리 (통신 누락 방지)
  const onIncompletePaymentFound = (payment) => {
    console.log("미완료 결제 데이터:", payment);
  };

  // 2. 수동 로그인 버튼 로직 (async/await 적용)
  usernameElement.addEventListener("click", async () => {
    if (isAuthenticated) return;

    usernameElement.textContent = "응답 대기 중...";
    usernameElement.style.color = "#AAAAAA";

    const hangTracker = setTimeout(() => {
      window.alert("응답 지연: 파이 브라우저가 응답하지 않습니다.\nDeveloper Portal의 App URL과 정확히 일치하는지 확인하세요.");
      usernameElement.textContent = "여기를 터치하여 다시 로그인";
      usernameElement.style.color = "#FFD700";
    }, 10000);

    try {
      // ★ async/await 방식으로 인증 호출
      const authResult = await Pi.authenticate(["username", "payments"], onIncompletePaymentFound);
      
      clearTimeout(hangTracker); // 정상 응답 시 타이머 즉시 해제
      
      const piUsername = authResult.user.username;
      
      if (piUsername) {
        isAuthenticated = true;
        usernameElement.textContent = piUsername;
        usernameElement.style.color = "#FFFFFF";
        usernameElement.style.textDecoration = "none";
        usernameElement.style.cursor = "default";
      }
    } catch (error) {
      clearTimeout(hangTracker); // 에러 발생 시 타이머 해제
      window.alert("로그인 거부 또는 에러: " + error.message);
      usernameElement.textContent = "여기를 터치하여 다시 로그인";
      usernameElement.style.color = "#FFD700";
    }
  });
  // 3. 결제(스왑) 생성 로직
  if (swapButton) {
    swapButton.addEventListener("click", () => {
      if (!isAuthenticated) {
        window.alert("먼저 상단의 '여기를 터치하여 로그인'을 눌러 인증을 완료해주세요.");
        return;
      }

      try {
        Pi.createPayment({
          amount: 1, // Testnet Pi 수량
          memo: "TaskFi 스왑 테스트",
          metadata: { type: "swap" }
        }, {
          onReadyForServerApproval: async (paymentId) => {
            try {
              const res = await fetch("/api/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId })
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } catch(e) {
              window.alert("서버 승인 에러: " + e.message);
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const res = await fetch("/api/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid })
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } catch(e) {
              window.alert("서버 완료 처리 에러: " + e.message);
            }
          },
          onCancel: (paymentId) => {
            window.alert("사용자가 결제를 취소했습니다.");
          },
          onError: (error, payment) => {
            window.alert("결제 진행 중 에러 발생: " + error.message);
          },
          onCompleted: (paymentId) => {
            window.alert("결제가 성공적으로 최종 완료되었습니다!");
          }
        });
      } catch (e) {
        window.alert("결제창 호출 에러: " + e.message);
      }
    });
  }
});