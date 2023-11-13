import styles from './styles.module.scss';
export function SubMainPage() {
    return <main>
        Sub page
        <div className={`${styles.test} ${styles.inner}`}>test</div>
    </main>
}