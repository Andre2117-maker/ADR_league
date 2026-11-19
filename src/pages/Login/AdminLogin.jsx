import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Login.css";

/* ---------- ícones desenhados (sem emoji) ---------- */
const LockIco = ({ open }) => (
  <svg className={`lg-lock ${open ? "is-open" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
    <path className="lg-lock-shackle" d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M12 14.6v2.6" />
  </svg>
);

const EyeIco = ({ off }) => (
  <svg className="lg-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

const BackIco = () => (
  <svg className="lg-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const WarnIco = () => (
  <svg className="lg-ico" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3.5 2.5 20h19zM12 10v4.5M12 17.2v.3" />
  </svg>
);

/* ---------- limite de tentativas (fica salvo neste aparelho) ---------- */
const MAX_TRIES = 5;
const LOCK_SECONDS = 30;
const KEY = "adr_login_lock";

const readLock = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { tries: 0, until: 0 };
  } catch {
    return { tries: 0, until: 0 };
  }
};
const saveLock = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* navegador sem armazenamento: segue sem salvar */
  }
};

function AdminLogin({ setIsAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();

  // página onde a pessoa estava antes de clicar em "Acesso admin"
  // (vem do NavBar). Se não tiver, volta para a Home.
  const voltarPara = (() => {
    const from = location.state?.from;
    if (typeof from !== "string" || !from.startsWith("/")) return "/";
    if (from.startsWith("/admin-login")) return "/";
    return from;
  })();
  const inputRef = useRef(null);

  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [erro, setErro] = useState("");
  const [shake, setShake] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | checking | ok
  const [lock, setLock] = useState(readLock);
  const [now, setNow] = useState(Date.now());

  const locked = lock.until > now;
  const secondsLeft = Math.ceil((lock.until - now) / 1000);

  // contagem regressiva do bloqueio
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [locked]);

  // quando o bloqueio acaba, volta o foco pro campo
  useEffect(() => {
    if (!locked && lock.until) {
      const v = { tries: 0, until: 0 };
      setLock(v);
      saveLock(v);
      setErro("");
      inputRef.current?.focus();
    }
  }, [locked, lock.until]);

  const login = (e) => {
    e.preventDefault();
    if (locked || status !== "idle") return;
    if (!senha) {
      setErro("Digite a senha.");
      setShake((n) => n + 1);
      return;
    }

    setStatus("checking");

    // pequeno atraso: dá o efeito de "verificando" e atrapalha chute em massa
    setTimeout(() => {
      if (senha === import.meta.env.VITE_ADMIN_PASSWORD) {
        saveLock({ tries: 0, until: 0 });
        setErro("");
        setStatus("ok");
        setTimeout(() => {
          setIsAdmin(true);
          navigate(voltarPara, { replace: true });
        }, 700);
        return;
      }

      const tries = lock.tries + 1;
      const v =
        tries >= MAX_TRIES
          ? { tries, until: Date.now() + LOCK_SECONDS * 1000 }
          : { tries, until: 0 };
      setLock(v);
      saveLock(v);
      setNow(Date.now());
      setStatus("idle");
      setSenha("");
      setShake((n) => n + 1);
      setErro(
        tries >= MAX_TRIES
          ? ""
          : `Senha incorreta. ${MAX_TRIES - tries} tentativa${MAX_TRIES - tries > 1 ? "s" : ""} restante${MAX_TRIES - tries > 1 ? "s" : ""}.`,
      );
      inputRef.current?.focus();
    }, 450);
  };

  const checkCaps = (e) => setCaps(e.getModifierState?.("CapsLock") || false);

  return (
    <div className="adm-login-page lg-page">
      <form
        key={shake}
        className={`lg-card ${shake ? "lg-shake" : ""} ${status === "ok" ? "is-ok" : ""}`}
        onSubmit={login}
        noValidate
      >
        <span className="lg-kicker">Painel do administrador</span>

        <div className="lg-badge">
          <LockIco open={status === "ok"} />
        </div>

        <h1 className="lg-title">Área restrita</h1>
        <p className="lg-sub">Insira a chave de acesso para gerenciar a liga.</p>

        <label className="lg-label" htmlFor="lg-pass">
          Senha de acesso
        </label>
        <div className={`lg-field ${erro ? "has-error" : ""}`}>
          <input
            id="lg-pass"
            ref={inputRef}
            className="lg-input"
            type={show ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            value={senha}
            disabled={locked || status !== "idle"}
            onChange={(e) => {
              setSenha(e.target.value);
              if (erro) setErro("");
            }}
            onKeyUp={checkCaps}
            onKeyDown={checkCaps}
            autoFocus
          />
          <button
            type="button"
            className="lg-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Esconder senha" : "Mostrar senha"}
            title={show ? "Esconder senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            <EyeIco off={show} />
          </button>
        </div>

        <div className="lg-msgs" aria-live="polite">
          {caps && !locked && (
            <p className="lg-msg lg-caps">
              <WarnIco /> Caps Lock está ligado
            </p>
          )}
          {erro && <p className="lg-msg lg-err">{erro}</p>}
          {locked && (
            <p className="lg-msg lg-err">
              Muitas tentativas. Tente de novo em {secondsLeft}s.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="lg-btn"
          disabled={locked || status !== "idle"}
        >
          {status === "checking" && <span className="lg-spin" aria-hidden="true" />}
          {status === "ok"
            ? "Liberado"
            : status === "checking"
              ? "Verificando"
              : locked
                ? `Aguarde ${secondsLeft}s`
                : "Acessar painel"}
        </button>

        <button type="button" className="lg-back" onClick={() => navigate(voltarPara)}>
          <BackIco /> {voltarPara === "/" ? "Voltar para a tabela" : "Voltar"}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
