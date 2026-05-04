// ==========================================
// 1. Firebase 설정 (Firebase Settings)
// ==========================================
// TODO: Firebase 콘솔에서 발급받은 본인의 설정값으로 변경하세요.
const firebaseConfig = {
  apiKey: "AIzaSyCmQgIdf3iE5gAtClO1sN2AXa2g52ayny0",
  authDomain: "robot-36f89.firebaseapp.com",
  databaseURL: "https://robot-36f89-default-rtdb.firebaseio.com",
  projectId: "robot-36f89",
  storageBucket: "robot-36f89.firebasestorage.app",
  messagingSenderId: "16710342265",
  appId: "1:16710342265:web:149e1520bede0320a926a8",
  measurementId: "G-8XRXDQ3QJ6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const boardList = document.getElementById('board-list');
const modal = document.getElementById('post-modal');
const btnWritePost = document.getElementById('btn-write-post');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSavePost = document.getElementById('btn-save-post');

const inputTitle = document.getElementById('post-title');
const inputBody = document.getElementById('post-body');
const inputAuthor = document.getElementById('post-author');
const inputPassword = document.getElementById('post-password');
const modalTitle = document.getElementById('modal-title');

let currentEditingId = null;

// ==========================================
// 2. 게시판 데이터 불러오기 (Read)
// ==========================================
function loadPosts() {
    // 실시간 연동 (onSnapshot)
    db.collection("freeboard").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        boardList.innerHTML = '';
        if (snapshot.empty) {
            boardList.innerHTML = '<p class="loading-text">등록된 게시글이 없습니다.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            
            const date = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : '';

            const postEl = document.createElement('div');
            postEl.className = 'post-item';
            postEl.innerHTML = `
                <div class="post-header">
                    <span class="post-title">${post.title}</span>
                    <span class="post-meta">${post.author} | ${date}</span>
                </div>
                <div class="post-content">
                    ${post.body}
                </div>
                <div class="post-actions">
                    <button onclick="editPost('${postId}', '${post.title}', '${post.body}', '${post.author}', '${post.password}')">수정</button>
                    <button onclick="deletePost('${postId}', '${post.password}')">삭제</button>
                    <button onclick="toggleComments('${postId}')" style="color: var(--primary-color); font-weight: 600;">댓글 보기/쓰기</button>
                </div>
                
                <div class="comments-section" id="comments-${postId}">
                    <div id="comment-list-${postId}"></div>
                    <div class="comment-input-area">
                        <input type="text" id="comment-input-${postId}" placeholder="댓글 달기...">
                        <button class="btn-primary" onclick="addComment('${postId}')">등록</button>
                    </div>
                </div>
            `;
            boardList.appendChild(postEl);
            
            // 게시글 하단 댓글 불러오기
            loadComments(postId);
        });
    }, (error) => {
        console.error("게시글 불러오기 실패:", error);
        if(error.code === 'permission-denied') {
            boardList.innerHTML = '<p class="loading-text" style="color:red;">Firebase 규칙 권限이 없습니다. 콘솔에서 Firestore 규칙을 true로 변경해주세요.</p>';
        }
    });
}

// ==========================================
// 3. 게시글 쓰기 및 수정 (Create / Update)
// ==========================================
btnSavePost.addEventListener('click', () => {
    const title = inputTitle.value.trim();
    const body = inputBody.value.trim();
    const author = inputAuthor.value.trim();
    const password = inputPassword.value.trim();

    if (!title || !body || !author || !password) {
        alert("모든 항목을 입력해주세요.");
        return;
    }

    if (currentEditingId) {
        // 수정 모드
        db.collection("freeboard").doc(currentEditingId).update({
            title: title,
            body: body,
            author: author,
            password: password // 실제로는 평문저장 권장 안함
        }).then(() => {
            closeModal();
        }).catch(error => alert("수정 실패: " + error.message));
    } else {
        // 새 글 쓰기 모드
        db.collection("freeboard").add({
            title: title,
            body: body,
            author: author,
            password: password,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            closeModal();
        }).catch(error => alert("작성 실패: " + error.message));
    }
});

// ==========================================
// 4. 게시글 삭제 (Delete)
// ==========================================
window.deletePost = function(postId, correctPassword) {
    const pwd = prompt("게시글 비밀번호를 입력하세요:");
    if (pwd === null) return;
    
    if (pwd === correctPassword) {
        if(confirm("정말로 삭제하시겠습니까?")) {
            db.collection("freeboard").doc(postId).delete()
              .then(() => alert("삭제되었습니다."))
              .catch(e => alert("삭제 실패: " + e.message));
        }
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}

window.editPost = function(postId, title, body, author, correctPassword) {
    const pwd = prompt("게시글 비밀번호를 입력하세요:");
    if (pwd === null) return;

    if (pwd === correctPassword) {
        currentEditingId = postId;
        modalTitle.textContent = "게시글 수정";
        inputTitle.value = title;
        inputBody.value = body;
        inputAuthor.value = author;
        inputPassword.value = correctPassword;
        openModal();
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}

// ==========================================
// 5. 댓글 기능 (Comments)
// ==========================================
window.toggleComments = function(postId) {
    const el = document.getElementById(`comments-${postId}`);
    el.classList.toggle('open');
}

function loadComments(postId) {
    const commentList = document.getElementById(`comment-list-${postId}`);
    db.collection("freeboard").doc(postId).collection("comments")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
          commentList.innerHTML = '';
          snapshot.forEach(doc => {
              const c = doc.data();
              const div = document.createElement('div');
              div.className = 'comment-item';
              div.innerHTML = `<b>익명</b>: ${c.text} 
                <button onclick="deleteComment('${postId}', '${doc.id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:12px; margin-left:10px;">x</button>`;
              commentList.appendChild(div);
          });
      });
}

window.addComment = function(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    db.collection("freeboard").doc(postId).collection("comments").add({
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        input.value = '';
    });
}

window.deleteComment = function(postId, commentId) {
    if(confirm("댓글을 삭제하시겠습니까?")) {
        db.collection("freeboard").doc(postId).collection("comments").doc(commentId).delete();
    }
}

// Modal Controls
function openModal() { modal.classList.remove('hidden'); }
function closeModal() {
    modal.classList.add('hidden');
    inputTitle.value = '';
    inputBody.value = '';
    inputAuthor.value = '';
    inputPassword.value = '';
    currentEditingId = null;
    modalTitle.textContent = "새 게시글 작성";
}

btnWritePost.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);

// 초기 로딩
document.addEventListener('DOMContentLoaded', () => {
    // Firebase가 설정되지 않은 경우 에러를 방지하기 위한 체크
    if(firebaseConfig.apiKey === "YOUR_API_KEY") {
        boardList.innerHTML = '<p class="loading-text" style="color:#d97706; font-weight:bold;">⚠️ app.js 파일에서 Firebase 설정값을 입력해야 게시판이 표시됩니다.</p>';
    } else {
        loadPosts();
    }
});
