export default function SplitPane({ list, detail, hasSelection }) {
    return (
        <div className="split-view">
            <div className={`split-list ${hasSelection ? "mobile-hidden" : ""}`}>{list}</div>
            <div className={`split-detail ${!hasSelection ? "mobile-hidden" : ""}`}>{detail}</div>
        </div>
    );
}
