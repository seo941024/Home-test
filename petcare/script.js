/* ═══════════════════════════════════════════════════════════
   펫케어 — 메인 스크립트
   ───────────────────────────────────────────────────────────
   API 키 설정 — 아래 두 칸에 발급받은 키를 넣으면 실데이터로 작동해요.
   비워두면 키 없이 데모(샘플 데이터)로 표시됩니다.

   • dataGoKrKey : 공공데이터포털(data.go.kr) "유기동물 조회 서비스"
                   신청 → 일반 인증키(Decoding) 복사해서 붙여넣기
   • kakaoKey    : 카카오 개발자(developers.kakao.com) JavaScript 키
                   내 애플리케이션 → 플랫폼 → Web에 사이트 도메인 등록 필요
   ═══════════════════════════════════════════════════════════ */
const CONFIG = {
  dataGoKrKey: "9cb56fac6e15497e82cdc6208b069b7a",
  kakaoKey: "39e00cfd2a28be631ea528abdcb4359d",
};

/* 짧은 셀렉터 헬퍼 */
const $ = (id) => document.getElementById(id);

/* ── 상태 관리 (localStorage) ── */
let currentUser = JSON.parse(localStorage.getItem("petcare_user") || "null");

function saveUser(u) {
  currentUser = u;
  localStorage.setItem("petcare_user", JSON.stringify(u));
}

/* ── 페이지 초기화 ── */
function initPage() {
  if (currentUser) {
    renderLoggedIn();
  } else {
    renderLoggedOut();
  }
}

function renderLoggedIn() {
  const verified = currentUser.verified;
  const name = currentUser.name;

  // 네비 업데이트
  $("navActions").innerHTML = `
    <span class="nav-user-badge">${verified ? "🏅" : "👤"} ${name} 님</span>
    ${!verified ? `<button class="btn btn-outline btn-sm" onclick="openAuthModal()">동물등록 인증</button>` : ""}
    <button class="btn btn-ghost btn-sm" onclick="doLogout()">로그아웃</button>
  `;

  // 커뮤니티 표시
  $("communityLocked").style.display = "none";
  $("communityContent").style.display = "block";

  // 인증 유도 배너
  const banner = $("communityVerifyBanner");
  if (banner) banner.style.display = verified ? "none" : "flex";

  // 일기 이름
  const el = $("diaryPetName");
  if (el) el.textContent = name + " 님네 아이";
}

function renderLoggedOut() {
  $("navActions").innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="openLoginModal('login')">로그인</button>
    <button class="btn btn-primary btn-sm" onclick="openLoginModal('signup')">회원가입</button>
  `;
  $("communityLocked").style.display = "block";
  $("communityContent").style.display = "none";
}

/* ── 회원가입 / 로그인 모달 ── */
function openLoginModal(tab) {
  switchTab(tab);
  openModal("loginModal");
}

function switchTab(tab) {
  $("formSignup").style.display = tab === "signup" ? "block" : "none";
  $("formLogin").style.display = tab === "login" ? "block" : "none";
  $("tabSignup").classList.toggle("active", tab === "signup");
  $("tabLogin").classList.toggle("active", tab === "login");
}

function doSignup() {
  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const pw = $("signupPw").value;
  const pw2 = $("signupPw2").value;
  let ok = true;

  const show = (id, cond) => {
    $(id).style.display = cond ? "block" : "none";
    if (cond) ok = false;
  };
  show("errSignupName", !name);
  show("errSignupEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  show("errSignupPw", pw.length < 6);
  show("errSignupPw2", pw !== pw2);
  if (!ok) return;

  // localStorage에 계정 저장 (비밀번호는 실제 서비스에선 절대 이렇게 저장 안 함)
  const accounts = JSON.parse(localStorage.getItem("petcare_accounts") || "{}");
  if (accounts[email]) {
    $("errSignupEmail").textContent = "이미 가입된 이메일이에요";
    $("errSignupEmail").style.display = "block";
    return;
  }
  accounts[email] = { name, pw };
  localStorage.setItem("petcare_accounts", JSON.stringify(accounts));

  saveUser({ name, email, verified: false });
  closeModal("loginModal");
  initPage();
  showToast(`🎉 ${name} 님, 환영해요!`);
}

function doLogin() {
  const email = $("loginEmail").value.trim();
  const pw = $("loginPw").value;
  const accounts = JSON.parse(localStorage.getItem("petcare_accounts") || "{}");
  const acc = accounts[email];
  const errEl = $("errLoginEmail");

  if (!acc || acc.pw !== pw) {
    errEl.textContent = "이메일 또는 비밀번호가 올바르지 않아요";
    errEl.style.display = "block";
    return;
  }
  errEl.style.display = "none";

  // 계정에 저장된 인증 상태 복원
  saveUser({
    name: acc.name,
    email,
    verified: acc.verified || false,
    petNums: acc.petNums || [],
  });
  closeModal("loginModal");
  initPage();
  showToast(`👋 ${acc.name} 님, 반갑습니다!`);
}

function doLogout() {
  localStorage.removeItem("petcare_user");
  currentUser = null;
  renderLoggedOut();
  showToast("로그아웃 됐어요");
}

/* ── 동물등록번호 인증 ── */
function checkAuthInput(el) {
  el.value = el.value.replace(/\D/g, "");
  $("authSubmit").disabled = el.value.length !== 15;
}

/* 등록번호 목록을 완료 화면에 렌더 (markLast=true면 마지막 항목에 "방금 등록" 배지) */
function renderPetNumbers(petNums, markLast) {
  return petNums
    .map(
      (n, i) =>
        `<div class="pet-num-row">
          <span class="pet-num-icon">🐾</span>
          <span class="pet-num-val">${n}</span>
          ${markLast && i === petNums.length - 1 ? '<span class="pet-num-new">방금 등록</span>' : ""}
        </div>`,
    )
    .join("");
}

function submitAuth() {
  const val = $("authInput").value;
  if (val.length !== 15) return;

  // 기존 등록 번호 목록 가져오기
  const accounts = JSON.parse(localStorage.getItem("petcare_accounts") || "{}");
  const email = currentUser.email;
  if (!accounts[email]) return;

  const petNums = accounts[email].petNums || [];
  if (!petNums.includes(val)) petNums.push(val);
  accounts[email].petNums = petNums;
  accounts[email].verified = true;
  localStorage.setItem("petcare_accounts", JSON.stringify(accounts));

  saveUser({ ...currentUser, verified: true, petNums });
  initPage();

  // 완료 화면으로 전환
  $("authFormView").style.display = "none";
  $("authDoneView").style.display = "block";
  $("authDoneNumbers").innerHTML = renderPetNumbers(petNums, true);
}

function addAnotherPet() {
  $("authDoneView").style.display = "none";
  $("authFormView").style.display = "block";
  $("authInput").value = "";
  $("authSubmit").disabled = true;
}

function openAuthModal() {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (currentUser.verified && currentUser.petNums && currentUser.petNums.length > 0) {
    // 이미 인증된 상태 → 완료 화면 바로 표시
    $("authFormView").style.display = "none";
    $("authDoneView").style.display = "block";
    $("authDoneNumbers").innerHTML = renderPetNumbers(currentUser.petNums, false);
  } else {
    // 미인증 → 입력 화면
    $("authFormView").style.display = "block";
    $("authDoneView").style.display = "none";
    const input = $("authInput");
    if (input) input.value = "";
    const btn = $("authSubmit");
    if (btn) btn.disabled = true;
  }
  openModal("authModal");
}

/* ── 커뮤니티 ── */
function connectMentor(name) {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (!currentUser.verified) {
    showToast("🔒 멘토 연결은 동물등록번호 인증 후 가능해요");
    setTimeout(() => openAuthModal(), 1200);
    return;
  }
  showToast(`📩 ${name} 님에게 연결 요청을 보냈어요!`);
}

function openDiaryModal() {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (!currentUser.verified) {
    showToast("🔒 성장 일기는 동물등록번호 인증 후 가능해요");
    setTimeout(() => openAuthModal(), 1200);
    return;
  }
  $("diaryText").value = "";
  document
    .querySelectorAll("#diaryModal input[type=checkbox]")
    .forEach((cb) => (cb.checked = false));
  openModal("diaryModal");
}

function saveDiary() {
  const text = $("diaryText").value.trim();
  if (!text) {
    showToast("일기 내용을 입력해주세요");
    return;
  }

  const tags = [
    ...document.querySelectorAll("#diaryModal input[type=checkbox]:checked"),
  ].map((cb) => cb.value);
  const today = new Date();
  const day = today.getDate();

  const entry = document.createElement("div");
  entry.className = "diary-day";
  entry.innerHTML = `
    <div class="diary-date"><strong>${day}</strong>일</div>
    <div class="diary-content">
      <p></p>
      ${tags.length ? `<div class="diary-icons">${tags.map((t) => `<span class="diary-icon">${t}</span>`).join("")}</div>` : ""}
    </div>
  `;
  // 사용자 입력은 textContent로 안전하게 삽입 (XSS 방지)
  entry.querySelector(".diary-content p").textContent = text;
  $("diaryEntries").prepend(entry);
  closeModal("diaryModal");
  showToast("📓 일기가 저장됐어요!");
}

function exportPDF() {
  if (!currentUser) {
    openLoginModal("login");
    return;
  }
  if (!currentUser.verified) {
    showToast("🔒 PDF 내보내기는 동물등록번호 인증 후 가능해요");
    return;
  }
  showToast("📄 PDF 내보내기 기능은 서버 연동 후 제공될 예정이에요");
}

/* ── 반려동물 선택 ── */
function selectPet(el) {
  document
    .querySelectorAll(".hero-pet-card")
    .forEach((c) => {
      c.classList.remove("active");
      c.setAttribute("aria-pressed", "false");
    });
  el.classList.add("active");
  el.setAttribute("aria-pressed", "true");
}

/* ── 체크리스트 ── */
document.querySelectorAll("#checklistItems input[type=checkbox]").forEach((cb) => {
  cb.addEventListener("change", () => {
    $("checkCount").textContent =
      document.querySelectorAll("#checklistItems input:checked").length;
  });
});

/* ── 예산 계산기 ── */
function updateBudget(val) {
  const fee = parseInt(val);
  $("adoptFeeLabel").textContent = fee.toLocaleString();
  $("bAdopt").textContent = fee.toLocaleString() + "원";
  $("budgetTotal").textContent = (fee + 200000).toLocaleString() + "원";
}

/* ── 성향 퀴즈 ── */
let quizStep = 1;
const quizQuestions = [
  {
    q: "하루에 산책이나 외출에 쓸 수 있는 시간은?",
    opts: ["1시간 이상", "30분 정도", "거의 없음", "재택근무라 항상"],
  },
  {
    q: "현재 거주 형태는?",
    opts: ["마당 있는 주택", "아파트/오피스텔", "원룸", "반려동물 불가 건물"],
  },
  {
    q: "반려동물 비용으로 월 얼마 지출 가능한가요?",
    opts: ["5만원 이하", "5~15만원", "15~30만원", "제한 없음"],
  },
  {
    q: "원하는 교감 방식은?",
    opts: ["같이 달리고 뛰기", "쓰다듬고 안기", "조용히 옆에 있기", "바라보는 것만으로 충분"],
  },
  {
    q: "털빠짐 감당 가능한가요?",
    opts: ["털? 상관없음", "적당히는 괜찮음", "최대한 적게", "털 알레르기 있음"],
  },
];
const QUIZ_TOTAL = quizQuestions.length;

function nextQuiz(el) {
  document.querySelectorAll(".quiz-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  setTimeout(() => {
    quizStep = Math.min(quizStep + 1, QUIZ_TOTAL);
    $("quizBar").style.width = (quizStep / QUIZ_TOTAL) * 100 + "%";
    $("quizStep").textContent = `질문 ${quizStep} / ${QUIZ_TOTAL}`;
    const q = quizQuestions[quizStep - 1];
    $("quizQ").textContent = q.q;
    $("quizOptions").innerHTML = q.opts
      .map((o) => `<div class="quiz-option" onclick="nextQuiz(this)">${o}</div>`)
      .join("");
    if (quizStep === QUIZ_TOTAL) setTimeout(() => openModal("quizModal"), 800);
  }, 300);
}

/* ── 바디랭귀지 ── */
function showBodyLang(title, emoji, desc) {
  $("modalTitle").textContent = title;
  $("modalEmoji").textContent = emoji;
  $("modalDesc").textContent = desc;
  openModal("bodyLangModal");
}

/* ── 위험 음식 검색 ── */
const dangerDB = {
  포도: {
    level: "🔴",
    title: "⚠️ 매우 위험 — 절대 금지",
    desc: "강아지·고양이 모두 신부전을 일으킬 수 있어요. 건포도도 동일하게 위험합니다.",
    color: "#FFEBEE",
    border: "#E53935",
  },
  초콜릿: {
    level: "🔴",
    title: "⚠️ 매우 위험 — 절대 금지",
    desc: "테오브로민 성분이 심장·신경계에 독성을 일으켜요. 다크 초콜릿일수록 위험도가 높습니다.",
    color: "#FFEBEE",
    border: "#E53935",
  },
  양파: {
    level: "🔴",
    title: "⚠️ 매우 위험 — 절대 금지",
    desc: "파, 마늘, 부추도 동일해요. 적혈구를 파괴해 빈혈을 일으킵니다. 익혀도 독성 그대로예요.",
    color: "#FFEBEE",
    border: "#E53935",
  },
  백합: {
    level: "🔴",
    title: "⚠️ 고양이에게 치명적",
    desc: "백합 꽃가루만 핥아도 고양이는 신부전으로 사망할 수 있어요. 집에 백합은 절대 금지.",
    color: "#FFEBEE",
    border: "#E53935",
  },
  아보카도: {
    level: "🟡",
    title: "⚠️ 주의 필요",
    desc: "페르신 성분이 소화기 이상을 일으킬 수 있어요. 주지 않는 게 안전합니다.",
    color: "#FFF9E6",
    border: "#F59E0B",
  },
  당근: {
    level: "🟢",
    title: "✅ 안전 — 적당히 OK",
    desc: "강아지에게 적당량의 당근은 건강에 좋아요! 다만 당분이 있으니 과다 급여는 피하세요.",
    color: "#EDF7F1",
    border: "#4CAF7D",
  },
};

function searchDanger() {
  const q = $("foodSearch").value.trim();
  const result = $("dangerResult");
  const data = dangerDB[q] || {
    level: "❓",
    title: "검색 결과 없음",
    desc: "데이터베이스에 없는 음식입니다. 동물병원이나 수의사에게 직접 문의해 주세요.",
    color: "#F5F5F5",
    border: "#ddd",
  };
  $("dangerEmoji").textContent = data.level;
  $("dangerTitle").textContent = data.title;
  $("dangerDesc").textContent = data.desc;
  result.style.borderColor = data.border;
  result.style.background = data.color;
  result.classList.add("show");
}

function quickSearch(q) {
  $("foodSearch").value = q;
  searchDanger();
  $("dangerResult").scrollIntoView({ behavior: "smooth", block: "center" });
}

$("foodSearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchDanger();
});

/* ── 모달 공통 ── */
function openModal(id) {
  $(id).classList.add("open");
}
function closeModal(id) {
  $(id).classList.remove("open");
}
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});
// ESC 키로 열린 모달 닫기
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"));
  }
});

/* ── 토스트 ── */
let toastTimer;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ═══════════════════════════════════════════════════════════
   유기동물 입양 — 공공데이터포털 유기동물 조회 서비스
   ═══════════════════════════════════════════════════════════ */
let adoptFilter = "all";
const UPKIND = { dog: "417000", cat: "422400" };

function setAdoptFilter(f, btn) {
  adoptFilter = f;
  document.querySelectorAll(".adopt-filter").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  loadAdopt();
}

async function loadAdopt() {
  const grid = $("adoptGrid");
  const notice = $("adoptNotice");
  grid.innerHTML = '<div class="adopt-loading">🐾 보호 중인 친구들을 불러오는 중...</div>';

  let items = [],
    live = false;
  if (CONFIG.dataGoKrKey) {
    try {
      items = await fetchAbandoned();
      live = items.length > 0;
    } catch (e) {
      console.warn("유기동물 API 호출 실패 — 데모로 표시합니다.", e);
    }
  }
  if (!items.length) items = demoAdopt();

  renderAdopt(items);
  notice.textContent = live
    ? "※ 공공데이터포털 실시간 유기동물 정보입니다."
    : "※ 데모 샘플입니다. CONFIG.dataGoKrKey에 키를 입력하면 실제 보호 중인 동물이 표시돼요.";
}

function fetchAbandoned() {
  return new Promise((resolve, reject) => {
    const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
    const today = new Date();
    const bgn = new Date(today.getTime() - 30 * 864e5);
    const cbName = "_adopt_cb_" + Date.now();
    const params = new URLSearchParams({
      serviceKey: CONFIG.dataGoKrKey,
      bgnde: fmt(bgn),
      endde: fmt(today),
      numOfRows: "8",
      pageNo: "1",
      _type: "jsonp",
      callback: cbName,
    });
    if (adoptFilter !== "all") params.set("upkind", UPKIND[adoptFilter]);

    window[cbName] = (json) => {
      document.getElementById("_adoptScript")?.remove();
      delete window[cbName];
      let arr = json.response?.body?.items?.item || [];
      if (!Array.isArray(arr)) arr = arr ? [arr] : [];
      resolve(
        arr.map((it) => ({
          photo: it.popfile || it.filename || null,
          kind: (it.kindCd || "").replace(/^\[.*?\]\s*/, "") || "믹스",
          sex: it.sexCd,
          age: it.age,
          weight: it.weight,
          place: it.orgNm || it.happenPlace,
          shelter: it.careNm,
          state: it.processState || "보호중",
          species: (it.kindCd || "").includes("고양이") ? "cat" : "dog",
        })),
      );
    };

    const s = document.createElement("script");
    s.id = "_adoptScript";
    s.src =
      "https://apis.data.go.kr/1543061/abandonmentPublicSrvc/abandonmentPublic?" +
      params.toString();
    s.onerror = () => {
      s.remove();
      delete window[cbName];
      reject(new Error("JSONP 실패"));
    };
    document.head.appendChild(s);
    setTimeout(() => {
      s.remove();
      delete window[cbName];
      reject(new Error("timeout"));
    }, 10000);
  });
}

/* 키 없을 때 데모 — 외부 사진 호출 없이 이모지 플레이스홀더만 사용 */
function demoAdopt() {
  const data = {
    dog: [
      { kind: "믹스견", age: "2021년생", weight: "8.5kg" },
      { kind: "포메라니안", age: "2019년생", weight: "3.2kg" },
      { kind: "진돗개 믹스", age: "2022년생", weight: "15kg" },
      { kind: "말티즈", age: "2015년생", weight: "4.0kg" },
      { kind: "시바 믹스", age: "2023년생", weight: "9.1kg" },
    ],
    cat: [
      { kind: "코리안숏헤어", age: "2022년생", weight: "4.2kg" },
      { kind: "턱시도 고양이", age: "2020년생", weight: "5.0kg" },
      { kind: "삼색이", age: "2023년생", weight: "3.5kg" },
      { kind: "치즈태비", age: "2021년생", weight: "4.8kg" },
    ],
  };
  const places = ["서울 마포구", "경기 고양시", "인천 부평구", "서울 강서구", "경기 수원시"];
  const shelters = ["행복유기동물보호소", "한국동물구조관리협회", "시립동물보호센터", "우리동물보호센터"];
  const plan =
    adoptFilter === "all"
      ? ["dog", "cat", "dog", "cat", "dog", "cat", "dog", "cat"]
      : Array(8).fill(adoptFilter);

  return plan.map((sp, i) => {
    const d = data[sp][i % data[sp].length];
    return {
      photo: null,
      species: sp,
      kind: d.kind,
      sex: Math.random() > 0.5 ? "M" : "F",
      age: d.age,
      weight: d.weight,
      place: places[i % places.length],
      shelter: shelters[i % shelters.length],
      state: "보호중",
    };
  });
}

function renderAdopt(items) {
  const grid = $("adoptGrid");
  if (!items.length) {
    grid.innerHTML = '<div class="adopt-loading">표시할 동물이 없어요</div>';
    return;
  }
  grid.innerHTML = items
    .map((it) => {
      const emoji = it.species === "cat" ? "🐱" : "🐶";
      const sexTxt = it.sex === "M" ? "♂ 수컷" : it.sex === "F" ? "♀ 암컷" : "성별미상";
      const photo = it.photo
        ? `<img src="${it.photo}" alt="${it.kind}" loading="lazy" onerror="this.parentElement.textContent='${emoji}'">`
        : emoji;
      return `<article class="adopt-card">
      <div class="adopt-photo">${photo}</div>
      <div class="adopt-body">
        <div class="adopt-kind">${emoji} ${it.kind}</div>
        <div class="adopt-meta">${sexTxt} · ${it.age || "나이미상"} · ${it.weight || "-"}<br>📍 ${it.place || "-"}<br>🏠 ${it.shelter || "-"}</div>
        <span class="adopt-badge">${it.state}</span>
      </div>
    </article>`;
    })
    .join("");
}

/* ═══════════════════════════════════════════════════════════
   카카오맵 — 멘토 위치 + 주변 동물병원 검색
   ═══════════════════════════════════════════════════════════ */
const MENTOR_LOCS = [
  { name: "김민준", lat: 37.5495, lng: 126.9136 }, // 합정
  { name: "이지아", lat: 37.5556, lng: 126.9015 }, // 망원
  { name: "박서준", lat: 37.553, lng: 126.918 }, // 서교
];
let kakaoMap = null,
  kakaoLoaded = false;

function initKakaoMap() {
  if (!CONFIG.kakaoKey) return; // 키 없으면 안내 placeholder 유지
  const s = document.createElement("script");
  s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${CONFIG.kakaoKey}&libraries=services&autoload=false`;
  s.onload = () =>
    kakao.maps.load(() => {
      kakaoLoaded = true;
      renderMap();
    });
  s.onerror = () => {
    $("petMap").textContent = "카카오맵 로드 실패 — 키와 도메인 등록을 확인하세요";
  };
  document.head.appendChild(s);
}

function renderMap() {
  const box = $("petMap");
  box.innerHTML = "";
  const center = new kakao.maps.LatLng(37.5535, 126.911);
  kakaoMap = new kakao.maps.Map(box, { center, level: 5 });
  MENTOR_LOCS.forEach((m) => {
    const mk = new kakao.maps.Marker({
      map: kakaoMap,
      position: new kakao.maps.LatLng(m.lat, m.lng),
    });
    const iw = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px 9px;font-size:12px">🐾 ${m.name} 멘토</div>`,
    });
    kakao.maps.event.addListener(mk, "click", () => iw.open(kakaoMap, mk));
  });
}

function findVets() {
  if (!CONFIG.kakaoKey || !kakaoLoaded) {
    showToast("카카오맵 키를 입력하면 주변 동물병원을 검색할 수 있어요");
    return;
  }
  const ps = new kakao.maps.services.Places();
  const center = kakaoMap.getCenter();
  ps.keywordSearch(
    "동물병원",
    (data, status) => {
      if (status !== kakao.maps.services.Status.OK) {
        showToast("주변 검색 결과가 없어요");
        return;
      }
      const list = $("vetList");
      list.innerHTML = data
        .slice(0, 5)
        .map(
          (p) =>
            `<div class="vet-item"><span class="vname">🏥 ${p.place_name}</span><span class="vdist">${(p.distance / 1000).toFixed(1)}km</span></div>`,
        )
        .join("");
      data.slice(0, 5).forEach(
        (p) =>
          new kakao.maps.Marker({
            map: kakaoMap,
            position: new kakao.maps.LatLng(p.y, p.x),
          }),
      );
    },
    {
      location: center,
      radius: 3000,
      sort: kakao.maps.services.SortBy.DISTANCE,
    },
  );
}

/* ═══════════════════════════════════════════════════════════
   갤러리 슬라이더
   ═══════════════════════════════════════════════════════════ */
const GALLERY_TOTAL = 6;
let galleryCurrentSlide = 0;

function galleryImgError(img, filename) {
  img.parentElement.innerHTML = `<div class="gallery-ph">🐾<small>${filename}</small></div>`;
}

function getVisibleSlides() {
  return window.innerWidth >= 768 ? 3 : 1;
}

function moveSlider(dir) {
  const maxSlide = GALLERY_TOTAL - getVisibleSlides();
  galleryCurrentSlide = Math.max(0, Math.min(galleryCurrentSlide + dir, maxSlide));
  updateGallery();
}

function goToSlide(idx) {
  const maxSlide = GALLERY_TOTAL - getVisibleSlides();
  galleryCurrentSlide = Math.max(0, Math.min(idx, maxSlide));
  updateGallery();
}

function updateGallery() {
  const track = $("galleryTrack");
  const slide = track.querySelector(".gallery-slide");
  if (!slide) return;
  const slideW = slide.offsetWidth + 20; // 20px = CSS gap
  track.style.transform = `translateX(-${galleryCurrentSlide * slideW}px)`;
  document.querySelectorAll(".gallery-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === galleryCurrentSlide);
    dot.setAttribute("aria-selected", i === galleryCurrentSlide ? "true" : "false");
  });
}

function initGallery() {
  const visible = getVisibleSlides();
  const totalDots = GALLERY_TOTAL - visible + 1;
  const dotsEl = $("galleryDots");
  dotsEl.innerHTML = Array.from(
    { length: totalDots },
    (_, i) =>
      `<button class="gallery-dot${i === 0 ? " active" : ""}" onclick="goToSlide(${i})" role="tab" aria-label="${i + 1}번 슬라이드" aria-selected="${i === 0}"></button>`,
  ).join("");
}

// 리사이즈 시 debounce 적용 (불필요한 재계산 방지)
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    galleryCurrentSlide = 0;
    initGallery();
    updateGallery();
  }, 150);
});

/* ── 시작 ── */
initPage();
loadAdopt();
initKakaoMap();
initGallery();
