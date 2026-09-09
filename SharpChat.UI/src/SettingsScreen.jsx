export default function SettingsScreen({ onLogout }) {
    return (
        <div style={{ padding: "2rem" }}>
            <h2>Settings</h2>
            <button onClick={onLogout}>Log out</button>
        </div>
    );
}
