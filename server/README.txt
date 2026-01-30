만약 'Cannot find package 'sqlite'' 오류가 발생하면, 'sqlite3'와 'sqlite'가 혼동될 수 있습니다.

index.js에서 'import { open } from "sqlite";'를 사용하려면 'sqlite' 패키지도 설치해야 하며, 'sqlite3'는 드라이버로만 사용됩니다.

npm install sqlite

을 추가로 실행해 주세요.

---

이미 'sqlite3'는 설치되어 있으니, 'sqlite' 패키지만 추가 설치하면 됩니다.