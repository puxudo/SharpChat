export default function ProfileScreen({ me, onUpdate }) {
    return (
        <div style={{ padding: "2rem" }}>
            <h2>Profile</h2>
            <p>Logged in as {me.username}</p>
        </div>
    );
}
