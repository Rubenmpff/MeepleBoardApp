const ENV = {
    development: {
      API_URL: "http://192.168.1.83:5000/MeepleBoard", // 🔹 Mantendo o `/MeepleBoard`
    },
    production: {
      API_URL: "https://api.meepleboard.com/MeepleBoard", // 🔹 Adicionando `/MeepleBoard` para evitar erros
    },
    staging: {
      API_URL: "https://staging.meepleboard.com/MeepleBoard", // 🔹 Se precisar de testes
    },
  };
  
  // 📌 Detecta o ambiente automaticamente
  const getEnvVars = () => (__DEV__ ? ENV.development : ENV.production);
  
  export default getEnvVars;
  