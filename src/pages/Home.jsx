import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';
import PropTypes from 'prop-types';

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo'); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();

  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
        if (res.data.length > 0) {
          setSelectListId(res.data[0].id.toString()); // `string` 型に変換してセット
        }
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, [cookies.token]);

  useEffect(() => {
    if (selectListId) {
      axios
        .get(`${url}/lists/${selectListId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks); // ここで取得したタスクのデータに dueDate が含まれているか確認
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [selectListId, cookies.token]);

  const handleSelectList = (id) => {
    setSelectListId(id);
  };

  // "e"キーボードイベントオブジェクト。key プロパティを使用して、押されたキーを検出する
  // "id"現在のリスト項目の ID。選択されたリスト項目の ID を管理するために使用される
  const handleKeyDown = (e, id) => {
    // "list"リスト項目の配列
    // findIndex メソッドを使用して、selectListId が現在選択されているリスト項目の ID と一致するインデックスを取得する  。
    // currentIndex には、選択されているリスト項目のインデックスが格納される
    const currentIndex = lists.findIndex((list) => list.id === selectListId);
    let nextIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); // デフォルトのキー操作（スクロールなど）を無効化
        nextIndex = currentIndex + 1; // 現在のインデックスに1を加え、次のリスト項目のインデックスを計算
        if (nextIndex < lists.length) {
          setSelectListId(lists[nextIndex].id.toString());
        }
        break;
      case 'ArrowUp':
        e.preventDefault(); // デフォルトのキー操作を無効化
        nextIndex = currentIndex - 1; // 現在のインデックスから1を引き、前のリスト項目のインデックスを計算
        if (nextIndex >= 0) {
          setSelectListId(lists[nextIndex].id.toString()); // 次のリスト項目を選択するために、setSelectListId を呼び出す
        }
        break;
      case 'Enter':
        e.preventDefault(); // デフォルトのキー操作を無効化
        handleSelectList(id); // 現在のリスト項目を選択するために handleSelectList を呼び出す
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={0}
                  onClick={() => handleSelectList(list.id.toString())}
                  onKeyDown={(e) => handleKeyDown(e, list.id.toString())}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
                value={isDoneDisplay}
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;

  if (!tasks) return <></>;

  const calculateRemainingTime = (limit) => {
    const now = new Date(); // 現在の日時を取得
    const due = new Date(limit); // 指定された期限日時を Date オブジェクトに変換
    const timeDiff = due - now; // 現在の日時と期限日時の差をミリ秒単位で計算

    if (timeDiff <= 0) return '期限切れ'; // timediffが0の場合、期限切れを表示する

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // 残り日数を計算
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ); // 残り時間を計算
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)); // 残り分を計算

    return `${days}日 ${hours}時間 ${minutes}分`; // 結果をフォーマットして返す
  };

  //  tasks 配列をフィルタリングして、新しい配列 filteredTasks を作成
  const filteredTasks = tasks.filter((task) =>
    isDoneDisplay === 'done' ? task.done : !task.done
  ); // isDoneDisplay が 'done' の場合、タスクが完了している (task.done が true) ものだけをフィルタリングする。

  return (
    <ul>
      {filteredTasks.map((task, key) => (
        <li key={key} className="task-item">
          <Link
            to={`/lists/${selectListId}/tasks/${task.id}`}
            className="task-item-link"
          >
            {task.title}
            <br />
            {task.done ? '完了' : '未完了'}
            <br />
            {task.limit ? (
              <>
                期限:${new Date(task.limit).toLocaleString()}`
                <br />
                残り: {calculateRemainingTime(task.limit)}
              </>
            ) : (
              '期限なし'
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
};

Tasks.propTypes = {
  tasks: PropTypes.array.isRequired,
  selectListId: PropTypes.string.isRequired, // `string` 型を期待
  isDoneDisplay: PropTypes.string.isRequired,
};

export default Tasks;
