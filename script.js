// 로컬 스토리지 키
const STORAGE_KEY = 'restaurant_reservations';

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    attachEventListeners();
});

// 앱 초기화 함수
function initApp() {
    // 최소 날짜를 오늘로 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
    document.getElementById('date').value = today;

    // 저장된 예약 목록 표시
    displayReservations();
}

// 이벤트 리스너 등록
function attachEventListeners() {
    document.getElementById('reservationForm').addEventListener('submit', handleFormSubmit);
}

// 폼 제출 처리
function handleFormSubmit(e) {
    e.preventDefault();

    // 폼 데이터 수집
    const reservation = {
        id: Date.now(),
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        guests: document.getElementById('guests').value,
        restaurant: document.getElementById('restaurant').value,
        notes: document.getElementById('notes').value.trim(),
        status: 'confirmed',
        createdAt: new Date().toLocaleString('ko-KR')
    };

    // 유효성 검사
    if (!validateReservation(reservation)) {
        return;
    }

    // 로컬 스토리지에 저장
    saveReservation(reservation);

    // 폼 초기화
    document.getElementById('reservationForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    // 성공 메시지 표시
    showAlert('예약이 완료되었습니다!', 'success');

    // 예약 목록 새로고침
    displayReservations();
}

// 예약 유효성 검사
function validateReservation(reservation) {
    const reservationDate = new Date(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
        showAlert('과거 날짜로 예약할 수 없습니다.', 'error');
        return false;
    }

    return true;
}

// 예약 저장
function saveReservation(reservation) {
    const reservations = getReservations();
    reservations.push(reservation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

// 저장된 예약 가져오기
function getReservations() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 예약 목록 표시
function displayReservations() {
    const reservations = getReservations();
    const container = document.getElementById('reservationsList');

    if (reservations.length === 0) {
        container.innerHTML = '<p class="empty-message">아직 예약이 없습니다.</p>';
        return;
    }

    // 날짜순으로 정렬
    reservations.sort((a, b) => new Date(a.date) - new Date(b.date));

    container.innerHTML = reservations
        .map(reservation => createReservationCard(reservation))
        .join('');

    // 삭제 버튼 이벤트 등록
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reservationId = parseInt(e.target.dataset.id);
            deleteReservation(reservationId);
        });
    });
}

// 예약 카드 HTML 생성
function createReservationCard(reservation) {
    const formattedDate = formatDate(reservation.date);
    const fullDateTime = `${formattedDate} ${reservation.time}`;

    return `
        <div class="reservation-card">
            <div class="card-header">
                <div class="restaurant-name">${escapeHtml(reservation.restaurant)}</div>
                <span class="status ${reservation.status}">${getStatusLabel(reservation.status)}</span>
            </div>
            
            <div class="card-info">
                <div class="info-row">
                    <span class="info-icon">👤</span>
                    <strong>이름:</strong>
                    <span>${escapeHtml(reservation.name)}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-icon">📞</span>
                    <strong>전화:</strong>
                    <span>${escapeHtml(reservation.phone)}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-icon">📅</span>
                    <strong>날짜/시간:</strong>
                    <span>${fullDateTime}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-icon">👥</span>
                    <strong>인원:</strong>
                    <span>${reservation.guests}명</span>
                </div>
                
                ${reservation.notes ? `
                <div class="info-row">
                    <span class="info-icon">📝</span>
                    <strong>요청:</strong>
                    <span>${escapeHtml(reservation.notes)}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="card-actions">
                <button class="btn-small btn-delete" data-id="${reservation.id}">삭제</button>
            </div>
        </div>
    `;
}

// 예약 삭제
function deleteReservation(id) {
    if (!confirm('이 예약을 삭제하시겠습니까?')) {
        return;
    }

    let reservations = getReservations();
    reservations = reservations.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));

    showAlert('예약이 삭제되었습니다.', 'info');
    displayReservations();
}

// 날짜 포맷팅
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('ko-KR', options);
}

// 상태 레이블 가져오기
function getStatusLabel(status) {
    const labels = {
        'confirmed': '예약완료',
        'pending': '대기중'
    };
    return labels[status] || status;
}

// 알림 표시
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;

    // 폼 섹션 상단에 추가
    const formSection = document.querySelector('.booking-form');
    formSection.insertBefore(alertDiv, formSection.firstChild);

    // 3초 후 자동 제거
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// XSS 방지를 위한 HTML 이스케이프
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
