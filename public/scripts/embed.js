(function() {
  // Avoid re-injecting if already present
  if (document.getElementById("react-embed-widget")) return;

  // Create a container div
  var container = document.createElement("div");
  container.id = "react-embed-widget";
  container.style.width = "100%";
  container.style.height = "965px"; // Adjust height as needed
  document.body.appendChild(container);

  // Create an iframe
  var iframe = document.createElement("iframe");
  iframe.src = "https://dccisummit.viettelcdn.com.vn/public/register/iframe/c96c600d-cb72-4eae-9410-afcb9db53c76/570ce4b1-28e0-42d9-95e3-b72daf525550"; // Your hosted React page
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  // Inject the iframe into the container
  container.appendChild(iframe);
})();