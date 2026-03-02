// app.js
document.addEventListener("DOMContentLoaded", () => {
  const usernameElement = document.getElementById("username");
  
  // 1. 화면에 현재 접속 URL 정확히 출력 (포털과 대조용)
  const currentUrl = window.location.href;
  console.log("Current URL:", currentUrl);

  let isAuthenticated = false;

  // 2. SDK 초기화 (이제 sandbox는 무조건 false로 고정합니다)
  try {
    Pi.init({ version: "2.0", sandbox: true });
    usernameElement.innerHTML = `[접속주소]<br><span style="font-size:12px; color:#aaa;">${currentUrl}</span><br><br>여기를 터치하여 로그인`;
    usernameElement.style.color = "#FFD700"; 
    usernameElement.style.cursor = "pointer";
  } catch (err) {
    usernameElement.textContent = "초기화 실패: " + err.message;
    return;
  }

  const onIncompletePaymentFound = (payment) => {
    console.log("미완료 결제:", payment);
  };

  usernameElement.addEventListener("click", async () => {
    if (isAuthenticated) return;

    usernameElement.textContent = "인증 서버와 통신 중...";
    usernameElement.style.color = "#AAAAAA";

    const hangTracker = setTimeout(() => {
      // 에러 메시지에 현재 URL을 포함하여 정확한 불일치 원인을 눈으로 확인합니다.
      window.alert(
        `응답 지연 (10초)\n\n[현재 앱 주소]\n${currentUrl}\n\n위 주소가 Developer Portal의 URL과 일치하는지 확인하세요.`
      );
      usernameElement.innerHTML = "통신 실패. 다시 터치하여 로그인";
      usernameElement.style.color = "#FFD700";
    }, 10000);

    try {
      const authResult = await Pi.authenticate(["username", "payments"], onIncompletePaymentFound);
      clearTimeout(hangTracker); 
      
      const piUsername = authResult.user.username;
      if (piUsername) {
        isAuthenticated = true;
        usernameElement.textContent = "로그인 성공: " + piUsername;
        usernameElement.style.color = "#00FF00";
      }
    } catch (error) {
      clearTimeout(hangTracker);
      window.alert("인증 에러 발생: " + error.message);
      usernameElement.textContent = "로그인 에러. 다시 시도";
    }
  });
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



