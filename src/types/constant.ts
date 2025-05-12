const EmailPattern =
  /^(?!.*[.]{2,})[a-zA-Z0-9.%]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PhonePattern = /^0[1235789][0-9]{8}$/;

// const remoteUrl = "https://ute-zone-backend.onrender.com";

const remoteUrl = "http://localhost:7979";

export { EmailPattern, PhonePattern, remoteUrl };
