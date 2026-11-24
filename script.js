const SERVER_IP = "vochinhphu1.play.jumphosting.cloud";

function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    window.setTimeout(() => el.classList.remove("show"), 2200);
}

async function copyIP() {
    try {
        await navigator.clipboard.writeText(SERVER_IP);
    } catch {
        const field = document.createElement("textarea");
        field.value = SERVER_IP;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
    }
    toast("Đã sao chép IP: " + SERVER_IP);
}

function openModal() { document.getElementById("login-modal").classList.add("open"); }
function closeModal() { document.getElementById("login-modal").classList.remove("open"); }

function login(e) {
    e.preventDefault();
    const name = document.getElementById("u-name").value.trim();
    if (!name) return;
    localStorage.setItem("vcp_user", name);
    closeModal();
    renderAuth();
    toast("Xin chào, " + name);
}

function logout() {
    localStorage.removeItem("vcp_user");
    renderAuth();
    toast("Đã đăng xuất");
}

function renderAuth() {
    const user = localStorage.getItem("vcp_user");
    const nav = document.getElementById("auth-nav");
    const vault = document.getElementById("vault");
    nav.replaceChildren();

    if (user) {
        const name = document.createElement("span");
        name.textContent = user;
        name.style.marginRight = "10px";
        name.style.fontWeight = "700";
        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.className = "btn-outline";
        logoutButton.textContent = "Thoát";
        logoutButton.addEventListener("click", logout);
        nav.append(name, logoutButton);
        vault.style.display = "block";
        renderCoords();
    } else {
        const loginButton = document.createElement("button");
        loginButton.type = "button";
        loginButton.className = "btn-outline";
        loginButton.textContent = "Đăng nhập";
        loginButton.addEventListener("click", openModal);
        nav.append(loginButton);
        vault.style.display = "none";
    }
}

function readCoords() {
    try {
        const stored = JSON.parse(localStorage.getItem("vcp_coords") || "[]");
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function addCoord(e) {
    e.preventDefault();
    const name = document.getElementById("c-name").value.trim();
    const xyz = document.getElementById("c-xyz").value.trim();
    if (!name || !xyz) return;
    const list = readCoords();
    list.push({ id: Date.now(), name, xyz });
    localStorage.setItem("vcp_coords", JSON.stringify(list));
    document.getElementById("c-name").value = "";
    document.getElementById("c-xyz").value = "";
    renderCoords();
    toast("Đã lưu tọa độ");
}

function delCoord(id) {
    const list = readCoords().filter(item => item.id !== id);
    localStorage.setItem("vcp_coords", JSON.stringify(list));
    renderCoords();
}

function renderCoords() {
    const box = document.getElementById("coord-list");
    const list = readCoords();
    box.replaceChildren();

    if (!list.length) {
        const empty = document.createElement("p");
        empty.style.color = "var(--muted)";
        empty.style.fontSize = "0.85rem";
        empty.textContent = "Chưa có tọa độ nào.";
        box.append(empty);
        return;
    }

    list.forEach(item => {
        const row = document.createElement("div");
        row.className = "coord-item";
        const details = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = `${item.name}:`;
        const xyz = document.createElement("code");
        xyz.textContent = item.xyz;
        details.append(name, document.createTextNode(" "), xyz);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn-del";
        button.textContent = "Xóa";
        button.addEventListener("click", () => delCoord(item.id));
        row.append(details, button);
        box.append(row);
    });
}

async function checkStatus(manual = false) {
    const dot = document.getElementById("dot");
    const msg = document.getElementById("status-msg");
    const stState = document.getElementById("st-state");
    const stPlayers = document.getElementById("st-players");
    const stVer = document.getElementById("st-ver");
    const stTime = document.getElementById("st-time");
    const pList = document.getElementById("player-list");

    stTime.textContent = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    try {
        const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_IP)}`);
        if (!res.ok) throw new Error("Status API unavailable");
        const data = await res.json();

        if (data.online) {
            dot.classList.add("on");
            const on = data.players?.online ?? 0;
            const max = data.players?.max ?? "?";
            const ver = data.version || "1.21.11";

            msg.textContent = `Trực tuyến: ${on}/${max} người chơi (${ver})`;
            stState.textContent = "Đang hoạt động";
            stState.style.color = "var(--accent)";
            stPlayers.textContent = `${on} / ${max}`;
            stVer.textContent = ver;

            const players = data.players?.list || [];
            pList.replaceChildren();
            if (players.length) {
                players.forEach(player => {
                    const tag = document.createElement("span");
                    tag.className = "p-tag";
                    tag.textContent = player.name;
                    pList.append(tag);
                });
            } else {
                pList.textContent = on > 0 ? `Có ${on} người chơi đang trong server.` : "Chưa có người chơi nào online.";
            }
        } else {
            dot.classList.remove("on");
            msg.textContent = "Máy chủ ngoại tuyến hoặc đang bảo trì";
            stState.textContent = "Ngoại tuyến";
            stState.style.color = "#e63946";
            stPlayers.textContent = "0 / 0";
            pList.textContent = "Không có dữ liệu.";
        }
        if (manual) toast("Đã cập nhật trạng thái");
    } catch {
        dot.classList.remove("on");
        msg.textContent = "Không thể kiểm tra trạng thái máy chủ";
        stState.textContent = "Lỗi kết nối API";
        stState.style.color = "#e63946";
        stPlayers.textContent = "-- / --";
        pList.textContent = "Không thể tải dữ liệu máy chủ.";
    }
}

renderAuth();
checkStatus();
window.setInterval(() => checkStatus(false), 30000);
