import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase, configured } from "./supabaseClient";
import {
  IconWallet,
  IconSettings,
  IconX,
  IconCheck,
  IconArrowUpRight,
  IconArrowDownRight,
  IconCart,
  IconSend,
  IconReceipt,
  IconPlus,
  IconUser,
} from "./icons";
import {
  getTg,
  initTelegram,
  resolveFriendIndex,
  telegramDisplayName,
  applyTelegramTheme,
  syncTelegramChrome,
  syncTelegramViewportVar,
  haptic,
} from "./telegram";

const fmt = (n) => Math.round(n).toLocaleString("uz-UZ").replace(/,/g, " ");
const onlyDigits = (s) => s.replace(/[^0-9]/g, "");
const todayStr = () => new Date().toISOString().slice(0, 10);
const initials = (name) => (name || "?").trim().slice(0, 1).toUpperCase();

function computeBalance(transactions) {
  let balance = 0;
  for (const tx of transactions) {
    if (tx.type === "expense") {
      // Har biri qancha to'lagan bo'lsa, ulushdan ortig'i qarz sifatida yoziladi.
      balance += (tx.amount0 - tx.amount1) / 2;
    } else {
      balance += tx.from_friend === 0 ? tx.amount : -tx.amount;
    }
  }
  return balance;
}

function groupByDate(sorted) {
  const groups = [];
  let last = null;
  for (const tx of sorted) {
    if (tx.date !== last) {
      groups.push({ date: tx.date, items: [] });
      last = tx.date;
    }
    groups[groups.length - 1].items.push(tx);
  }
  return groups;
}

function dateLabel(dateStr) {
  const today = todayStr();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  if (dateStr === today) return "Bugun";
  if (dateStr === yesterday) return "Kecha";
  return dateStr;
}

/* ---------- Bottom sheet ---------- */

function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span>{title}</span>
          <button className="sheet-close" onClick={onClose} aria-label="Yopish">
            <IconX size={15} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Balance hero ---------- */

function BalanceHero({ friends, balance, onOpenSettings }) {
  let stateClass = "balance-even";
  let who = "Hisob-kitob teng";
  let amountText = "0 so'm";
  let StateIcon = IconCheck;

  if (Math.abs(balance) >= 1) {
    if (balance > 0) {
      stateClass = "owe-them";
      who = `${friends[1]} → ${friends[0]}ga qarzdor`;
      amountText = `${fmt(balance)} so'm`;
      StateIcon = IconArrowUpRight;
    } else {
      stateClass = "owe-you";
      who = `${friends[0]} → ${friends[1]}ga qarzdor`;
      amountText = `${fmt(-balance)} so'm`;
      StateIcon = IconArrowDownRight;
    }
  }

  return (
    <div className={`hero ${stateClass}`}>
      <button className="hero-settings" onClick={onOpenSettings} aria-label="Sozlash">
        <IconSettings size={17} />
      </button>
      <div className="hero-avatars">
        <div className="avatar">{initials(friends[0])}</div>
        <div className="hero-icon">
          <StateIcon size={16} />
        </div>
        <div className="avatar">{initials(friends[1])}</div>
      </div>
      <div className="hero-amount">{amountText}</div>
      <div className="hero-who">{who}</div>
    </div>
  );
}

/* ---------- Settings sheet content ---------- */

function SettingsForm({ friends, onRenameFriend, onCommitFriend, onClose }) {
  const save = () => {
    onCommitFriend(0);
    onCommitFriend(1);
    haptic("success");
    onClose();
  };
  return (
    <div>
      <label>{"1-do'st ismi"}</label>
      <input
        type="text"
        value={friends[0]}
        onChange={(e) => onRenameFriend(0, e.target.value)}
      />
      <label>{"2-do'st ismi"}</label>
      <input
        type="text"
        value={friends[1]}
        onChange={(e) => onRenameFriend(1, e.target.value)}
      />
      <button className="submit-btn" onClick={save}>
        Saqlash
      </button>
    </div>
  );
}

/* ---------- Add transaction sheet content ---------- */

function ExpenseShiftHint({ friends, amount0, amount1 }) {
  const a0 = parseFloat(amount0) || 0;
  const a1 = parseFloat(amount1) || 0;
  const total = a0 + a1;
  if (total <= 0) {
    return (
      <div className="hint">
        Har biringiz ushbu xaridga qancha pul qo'shganini kiriting — ulush
        avtomatik teng bo'linadi.
      </div>
    );
  }
  const shift = (a0 - a1) / 2;
  let text;
  if (Math.abs(shift) < 1) {
    text = `Jami ${fmt(total)} so'm, ikkalangiz ham teng to'lagansiz — qarz o'zgarmaydi.`;
  } else if (shift > 0) {
    text = `Jami ${fmt(total)} so'm (ulush: ${fmt(total / 2)} so'mdan) — ${friends[1]} ${friends[0]}ga ${fmt(shift)} so'm qarzdor bo'ladi.`;
  } else {
    text = `Jami ${fmt(total)} so'm (ulush: ${fmt(total / 2)} so'mdan) — ${friends[0]} ${friends[1]}ga ${fmt(-shift)} so'm qarzdor bo'ladi.`;
  }
  return <div className="hint">{text}</div>;
}

function AddTransactionForm({
  friends,
  onAddExpense,
  onAddTransfer,
  busy,
  onDone,
  currentUserIndex,
  onActionChange,
  hideOwnSubmit,
}) {
  const [tab, setTab] = useState("expense");
  const [expenseAmount0, setExpenseAmount0] = useState("");
  const [expenseAmount1, setExpenseAmount1] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [expenseNote, setExpenseNote] = useState("");

  const [transferFromChoice, setTransferFromChoice] = useState(null);
  const transferFrom = transferFromChoice ?? currentUserIndex ?? 0;
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(todayStr());
  const [transferNote, setTransferNote] = useState("");

  const submitExpense = async () => {
    const amount0 = parseFloat(expenseAmount0) || 0;
    const amount1 = parseFloat(expenseAmount1) || 0;
    if (amount0 + amount1 <= 0) return alert("Kamida bittasiga summa kiriting");
    await onAddExpense({
      amount0,
      amount1,
      date: expenseDate,
      note: expenseNote.trim(),
    });
    setExpenseAmount0("");
    setExpenseAmount1("");
    setExpenseNote("");
    onDone();
  };

  const submitTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) return alert("Summani kiriting");
    await onAddTransfer({
      from_friend: transferFrom,
      amount,
      date: transferDate,
      note: transferNote.trim(),
    });
    setTransferAmount("");
    setTransferNote("");
    onDone();
  };

  const expenseCanSubmit = (parseFloat(expenseAmount0) || 0) + (parseFloat(expenseAmount1) || 0) > 0;
  const transferCanSubmit = (parseFloat(transferAmount) || 0) > 0;

  useEffect(() => {
    onActionChange?.({
      canSubmit: tab === "expense" ? expenseCanSubmit : transferCanSubmit,
      run: tab === "expense" ? submitExpense : submitTransfer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tab,
    expenseCanSubmit,
    transferCanSubmit,
    busy,
    expenseAmount0,
    expenseAmount1,
    expenseDate,
    expenseNote,
    transferFrom,
    transferAmount,
    transferDate,
    transferNote,
  ]);

  return (
    <div>
      <div className="tabs">
        <button
          className={`tab-btn ${tab === "expense" ? "active" : ""}`}
          onClick={() => {
            haptic("light");
            setTab("expense");
          }}
        >
          <IconCart size={15} /> Xarid
        </button>
        <button
          className={`tab-btn ${tab === "transfer" ? "active" : ""}`}
          onClick={() => {
            haptic("light");
            setTab("transfer");
          }}
        >
          <IconSend size={15} /> Qarz berish/to'lash
        </button>
      </div>

      <div className="tab-panels-viewport">
        <div className={`tab-panels ${tab === "transfer" ? "shift" : ""}`}>
          <div className="tab-panel">
            <label>Kim qancha to'ladi?</label>
            <div className="row">
              <div>
                <label>{friends[0]} (so'm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="masalan: 200000"
                  value={expenseAmount0}
                  onChange={(e) => setExpenseAmount0(onlyDigits(e.target.value))}
                />
              </div>
              <div>
                <label>{friends[1]} (so'm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="masalan: 100000"
                  value={expenseAmount1}
                  onChange={(e) => setExpenseAmount1(onlyDigits(e.target.value))}
                />
              </div>
            </div>
            <ExpenseShiftHint
              friends={friends}
              amount0={expenseAmount0}
              amount1={expenseAmount1}
            />

            <label>Sana</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
            <label>Izoh (ixtiyoriy)</label>
            <input
              type="text"
              placeholder="masalan: xarid"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
            />
            {!hideOwnSubmit && (
              <button className="submit-btn" disabled={busy} onClick={submitExpense}>
                Qo'shish
              </button>
            )}
          </div>

          <div className="tab-panel">
            <label>Yo'nalish</label>
            <div className="pay-select">
              <div
                className={`pay-opt ${transferFrom === 0 ? "sel" : ""}`}
                onClick={() => {
                  haptic("light");
                  setTransferFromChoice(0);
                }}
              >
                {friends[0]} → {friends[1]}
              </div>
              <div
                className={`pay-opt ${transferFrom === 1 ? "sel" : ""}`}
                onClick={() => {
                  haptic("light");
                  setTransferFromChoice(1);
                }}
              >
                {friends[1]} → {friends[0]}
              </div>
            </div>
            <div className="hint">
              {friends[transferFrom]} {friends[1 - transferFrom]}ga naqd pul
              beradi (qarz berish ham, qarz to'lash ham shu yerdan).
            </div>

            <div className="row">
              <div>
                <label>Summa (so'm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="masalan: 60000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(onlyDigits(e.target.value))}
                />
              </div>
              <div>
                <label>Sana</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
            </div>
            <label>Izoh (ixtiyoriy)</label>
            <input
              type="text"
              placeholder="masalan: qarzni uzish"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
            />
            {!hideOwnSubmit && (
              <button className="submit-btn" disabled={busy} onClick={submitTransfer}>
                Qo'shish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- History ---------- */

function TxRow({ friends, tx, onDelete }) {
  if (tx.type === "expense") {
    const total = tx.amount0 + tx.amount1;
    const shift = (tx.amount0 - tx.amount1) / 2;
    let shiftText = "qarz o'zgarmadi";
    if (Math.abs(shift) >= 1) {
      shiftText =
        shift > 0
          ? `${friends[1]} ${fmt(shift)} so'm qarzdor bo'ldi`
          : `${friends[0]} ${fmt(-shift)} so'm qarzdor bo'ldi`;
    }
    return (
      <div className="tx">
        <div className="tx-icon tx-icon-expense">
          <IconCart size={16} />
        </div>
        <div className="tx-info">
          <div className="tx-main">
            {friends[0]}: {fmt(tx.amount0)} • {friends[1]}: {fmt(tx.amount1)}
          </div>
          <div className="tx-sub">
            {tx.note ? `${tx.note} • ` : ""}
            {shiftText}
          </div>
          {tx.created_by_name && (
            <div className="tx-creator">
              <IconUser size={11} /> {tx.created_by_name} qo'shdi
            </div>
          )}
        </div>
        <div className="tx-amt">{fmt(total)}</div>
        <button className="tx-del" onClick={() => onDelete(tx.id)} aria-label="O'chirish">
          <IconX size={14} />
        </button>
      </div>
    );
  }
  const fromName = friends[tx.from_friend];
  const toName = friends[1 - tx.from_friend];
  return (
    <div className="tx">
      <div className="tx-icon tx-icon-transfer">
        <IconSend size={16} />
      </div>
      <div className="tx-info">
        <div className="tx-main">
          {fromName} → {toName}
        </div>
        <div className="tx-sub">{tx.note || "Pul o'tkazma"}</div>
        {tx.created_by_name && (
          <div className="tx-creator">
            <IconUser size={11} /> {tx.created_by_name} qo'shdi
          </div>
        )}
      </div>
      <div className="tx-amt">{fmt(tx.amount)}</div>
      <button className="tx-del" onClick={() => onDelete(tx.id)} aria-label="O'chirish">
        <IconX size={14} />
      </button>
    </div>
  );
}

function HistoryList({ friends, transactions, onDelete, onClearAll }) {
  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) =>
        `${b.date}${b.created_at}` > `${a.date}${a.created_at}` ? 1 : -1
      ),
    [transactions]
  );
  const groups = useMemo(() => groupByDate(sorted), [sorted]);

  return (
    <div className="section">
      <div className="section-title">
        <h2>Tarix</h2>
        {transactions.length > 0 && (
          <button className="clear-link" onClick={onClearAll}>
            Tozalash
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <IconReceipt size={30} className="empty-icon" />
          <div>Hali yozuv yo'q</div>
          <div className="empty-hint">Pastdagi tugma bilan qo'shing</div>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.date} className="tx-group">
            <div className="tx-group-date">{dateLabel(g.date)}</div>
            <div className="tx-group-card">
              {g.items.map((tx) => (
                <TxRow key={tx.id} friends={friends} tx={tx} onDelete={onDelete} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------- App ---------- */

export default function App() {
  const [friends, setFriends] = useState(["Muhammadali", "Ulug'bek"]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(null);
  const [telegramUser, setTelegramUser] = useState(null);
  const [mainButtonState, setMainButtonState] = useState({ canSubmit: false });
  const mainButtonRunRef = useRef(() => {});
  const backActionRef = useRef(() => {});
  const friendsRef = useRef(friends);
  friendsRef.current = friends;

  // Telegram Mini App hayot aylanishi: ready/expand, mavzu va rang sinxronizatsiyasi,
  // viewport balandligi, foydalanuvchini aniqlash -- bir marta, ilova ochilganda.
  useEffect(() => {
    const tg = initTelegram();
    if (!tg) return;

    setTelegramUser(tg.initDataUnsafe?.user ?? null);
    setCurrentUserIndex(resolveFriendIndex(tg.initDataUnsafe?.user));

    applyTelegramTheme(tg);
    syncTelegramChrome(tg);
    syncTelegramViewportVar(tg);

    const onThemeChanged = () => {
      applyTelegramTheme(tg);
      syncTelegramChrome(tg);
    };
    const onViewportChanged = () => syncTelegramViewportVar(tg);

    tg.onEvent?.("themeChanged", onThemeChanged);
    tg.onEvent?.("viewportChanged", onViewportChanged);
    return () => {
      tg.offEvent?.("themeChanged", onThemeChanged);
      tg.offEvent?.("viewportChanged", onViewportChanged);
    };
  }, []);

  // BackButton: qaysi sheet ochiq bo'lsa, shuni yopadi. Bitta doimiy handler
  // ro'yxatdan o'tkaziladi, harakat esa ref orqali doim yangilanib turadi.
  useEffect(() => {
    backActionRef.current = () => {
      if (addOpen) setAddOpen(false);
      else if (settingsOpen) setSettingsOpen(false);
    };
  }, [addOpen, settingsOpen]);

  useEffect(() => {
    const tg = getTg();
    if (!tg?.BackButton) return;
    const handler = () => backActionRef.current();
    tg.BackButton.onClick(handler);
    return () => tg.BackButton.offClick(handler);
  }, []);

  useEffect(() => {
    const tg = getTg();
    if (!tg?.BackButton) return;
    if (addOpen || settingsOpen) tg.BackButton.show();
    else tg.BackButton.hide();
  }, [addOpen, settingsOpen]);

  // MainButton: "Yangi yozuv" sheet ochiq bo'lganda joriy tab'ning "Qo'shish"
  // amalini bajaradi -- shu bilan sahifadagi tugma o'rniga native tugma ishlaydi.
  useEffect(() => {
    const tg = getTg();
    if (!tg?.MainButton) return;
    const handler = () => mainButtonRunRef.current?.();
    tg.MainButton.onClick(handler);
    return () => tg.MainButton.offClick(handler);
  }, []);

  useEffect(() => {
    const tg = getTg();
    if (!tg?.MainButton) return;
    if (!addOpen) {
      tg.MainButton.hide();
      return;
    }
    tg.MainButton.setText("Qo'shish");
    tg.MainButton.setParams({
      is_visible: true,
      is_active: mainButtonState.canSubmit && !busy,
    });
    if (busy) tg.MainButton.showProgress(false);
    else tg.MainButton.hideProgress();
  }, [addOpen, mainButtonState, busy]);

  const hasNativeMainButton = Boolean(getTg()?.MainButton);

  const creatorName =
    currentUserIndex !== null ? friendsRef.current[currentUserIndex] : telegramDisplayName(telegramUser);

  const fetchAll = useCallback(async () => {
    const [{ data: settings, error: settingsErr }, { data: txs, error: txErr }] =
      await Promise.all([
        supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
        supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

    if (settingsErr || txErr) {
      setError((settingsErr || txErr).message);
      return;
    }
    setError(null);
    if (settings) setFriends([settings.name0, settings.name1]);
    setTransactions(txs || []);
  }, []);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    fetchAll().finally(() => setLoading(false));

    const channel = supabase
      .channel("qarz-hisobchi-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [configured, fetchAll]);

  const balance = useMemo(() => computeBalance(transactions), [transactions]);

  const handleRenameFriend = (index, value) => {
    const next = [...friends];
    next[index] = value;
    setFriends(next);
  };

  const commitFriendName = async (index) => {
    const payload =
      index === 0
        ? { id: 1, name0: friendsRef.current[0] }
        : { id: 1, name1: friendsRef.current[1] };
    const { error: err } = await supabase.from("settings").upsert(payload);
    if (err) setError(err.message);
  };

  const handleAddExpense = async ({ amount0, amount1, date, note }) => {
    setBusy(true);
    const { error: err } = await supabase.from("transactions").insert({
      type: "expense",
      amount0,
      amount1,
      date,
      note: note || null,
      created_by: currentUserIndex,
      created_by_name: creatorName,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      haptic("error");
    } else {
      haptic("success");
      await fetchAll();
    }
  };

  const handleAddTransfer = async ({ from_friend, amount, date, note }) => {
    setBusy(true);
    const { error: err } = await supabase.from("transactions").insert({
      type: "transfer",
      from_friend,
      amount,
      date,
      note: note || null,
      created_by: currentUserIndex,
      created_by_name: creatorName,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      haptic("error");
    } else {
      haptic("success");
      await fetchAll();
    }
  };

  const handleDelete = async (id) => {
    haptic("light");
    const { error: err } = await supabase.from("transactions").delete().eq("id", id);
    if (err) setError(err.message);
    else await fetchAll();
  };

  const handleClearAll = async () => {
    if (!confirm("Barcha tarixni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) return;
    haptic("warning");
    const { error: err } = await supabase
      .from("transactions")
      .delete()
      .not("id", "is", null);
    if (err) setError(err.message);
    else await fetchAll();
  };

  if (!configured) {
    return (
      <div className="app-shell">
        <div className="wrap">
          <h1>
            <IconWallet size={20} /> Qarz Hisobchi
          </h1>
          <div className="card error-banner">
            Supabase sozlanmagan. Loyiha papkasida <code>.env</code> fayl yarating
            va <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>{" "}
            qiymatlarini kiriting (namuna: <code>.env.example</code>).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar-title">
          <IconWallet size={18} /> Qarz Hisobchi
        </span>
        {creatorName && (
          <span className="whoami-chip">
            <IconUser size={11} /> Siz: {creatorName}
          </span>
        )}
      </header>

      <div className="wrap">
        {error && <div className="card error-banner">Xatolik: {error}</div>}

        {loading ? (
          <div className="empty-state">Yuklanmoqda...</div>
        ) : (
          <>
            <BalanceHero
              friends={friends}
              balance={balance}
              onOpenSettings={() => {
                haptic("light");
                setSettingsOpen(true);
              }}
            />
            <HistoryList
              friends={friends}
              transactions={transactions}
              onDelete={handleDelete}
              onClearAll={handleClearAll}
            />
          </>
        )}
      </div>

      {!addOpen && !settingsOpen && (
        <button
          className="fab"
          onClick={() => {
            haptic("medium");
            setAddOpen(true);
          }}
          aria-label="Qo'shish"
        >
          <IconPlus size={26} />
        </button>
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Yangi yozuv">
        <AddTransactionForm
          friends={friends}
          busy={busy}
          onAddExpense={handleAddExpense}
          onAddTransfer={handleAddTransfer}
          onDone={() => setAddOpen(false)}
          currentUserIndex={currentUserIndex}
          hideOwnSubmit={hasNativeMainButton}
          onActionChange={({ canSubmit, run }) => {
            mainButtonRunRef.current = run;
            setMainButtonState((prev) => (prev.canSubmit === canSubmit ? prev : { canSubmit }));
          }}
        />
      </Sheet>

      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Ismlarni sozlash"
      >
        <SettingsForm
          friends={friends}
          onRenameFriend={handleRenameFriend}
          onCommitFriend={commitFriendName}
          onClose={() => setSettingsOpen(false)}
        />
      </Sheet>
    </div>
  );
}
