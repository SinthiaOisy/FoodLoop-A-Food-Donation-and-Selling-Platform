 var uid = localStorage.getItem("userId");
  if (uid) {
    var role = localStorage.getItem("userRole");
    var name = localStorage.getItem("userName");

    var page = "../customer/customer.html";
    var label = "My Activity";
    if (role === "provider") {
      page = "../provider/provider.html";
      label = "My Dashboard";
    }

    document.getElementById("guestLinks").style.display = "none";
    document.getElementById("dashLink").style.display = "";
    document.getElementById("userMenu").style.display = "";

    document.getElementById("dashAnchor").href = page;
    document.getElementById("dashAnchor").textContent = label;
    document.getElementById("menuDash").href = page;
    document.getElementById("menuDash").textContent = label;
    document.getElementById("menuName").textContent = name;

    document.getElementById("userIcon").addEventListener("click", function (e) {
      e.stopPropagation();
      document.getElementById("userDropdown").classList.toggle("open");
    });
    document.addEventListener("click", function () {
      document.getElementById("userDropdown").classList.remove("open");
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      window.location.href = "../login/login1.html";
    });
  }