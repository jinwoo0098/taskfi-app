document.addEventListener("DOMContentLoaded", () => {
  const usernameElement = document.getElementById("username");
  const swapButton = document.querySelector(".swap-card .secondary-btn");
  
  let isAuthenticated = false;

  // 1. Pi SDK 초기화 (오픈 메인넷 통신 환경 확정)
  try {
    Pi.init({ version: "2.0", sandbox: false });
    
    // JS가 정상 로드되면 화면 텍스트가 바뀝니다.
    usernameElement.textContent = "여기를 터치하여 로그인";
    usernameElement.style.color = "#FFD700"; 
    usernameElement.style.textDecoration = "underline";
    usernameElement.style.cursor = "pointer";
  } catch (err) {
    window.alert("Pi SDK 초기화 에러: " + err.message);
    return;
  }

  // 필수 콜백 함수
  const onIncompletePaymentFound = (payment) => {
    console.log("미완료 결제 데이터:", payment);
  };

  // 2. 비동기 로그인 로직
  usernameElement.addEventListener("click", async () => {
    if (isAuthenticated) return;

    usernameElement.textContent = "로그인 처리 중...";
    usernameElement.style.color = "#AAAAAA";

    try {
      const authResult = await Pi.authenticate(["username", "payments"], onIncompletePaymentFound);
      const piUsername = authResult.user.username;
      
      if (piUsername) {
        isAuthenticated = true;
        usernameElement.textContent = piUsername;
        usernameElement.style.color = "#FFFFFF";
        usernameElement.style.textDecoration = "none";
        usernameElement.style.cursor = "default";
      }
    } catch (error) {
      window.alert("로그인 에러: " + error.message);
      usernameElement.textContent = "여기를 터치하여 다시 로그인";
      usernameElement.style.color = "#FFD700";
    }
  });

  // 3. 10번 체크리스트 완수를 위한 결제 테스트 로직
  if (swapButton) {
    swapButton.addEventListener("click", () => {
      if (!isAuthenticated) {
        window.alert("먼저 상단의 '여기를 터치하여 로그인'을 눌러 인증을 완료해주세요.");
        return;
      }

      try {
        Pi.createPayment({
          amount: 1, 
          memo: "TaskFi 스왑 결제 테스트",
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
          onCancel: (paymentId) => window.alert("사용자가 결제를 취소했습니다."),
          onError: (error, payment) => window.alert("결제 에러: " + error.message),
          onCompleted: (paymentId) => window.alert("결제가 성공적으로 완료되었습니다!")
        });
      } catch (e) {
        window.alert("결제창 호출 에러: " + e.message);
      }
    });
  }
});
