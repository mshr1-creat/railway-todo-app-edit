import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { url } from '../const';
import { useNavigate, useParams } from 'react-router-dom';
import './editTask.scss';

export const EditTask = () => {
  const navigate = useNavigate();
  const { listId, taskId } = useParams();
  const [cookies] = useCookies();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [dueDate, setDueDate] = useState(''); // 期限の状態を追加
  const [errorMessage, setErrorMessage] = useState('');

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleIsDoneChange = (e) => setIsDone(e.target.value === 'done');
  const handleDueDateChange = (e) => setDueDate(e.target.value || ''); // 期限の変更ハンドラ

  const onUpdateTask = () => {
    console.log(isDone);
    const data = {
      title: title,
      detail: detail,
      done: isDone,
      limit: dueDate ? new Date(dueDate).toISOString() : null, // 期限をISO形式に変換
    };

    // サーバーに期限情報を送信しない形で、期限をフロントエンドでのみ管理
    axios
      .put(`${url}/lists/${listId}/tasks/${taskId}`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        setErrorMessage(`更新に失敗しました。${err}`);
      });
  };

  const onDeleteTask = () => {
    axios
      .delete(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        setErrorMessage(`削除に失敗しました。${err}`);
      });
  };

  useEffect(() => {
    axios
      .get(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        console.log('API レスポンス:', res.data); // 追加: API レスポンスの確認
        const task = res.data;
        setTitle(task.title || ''); // 初期値として空文字を設定
        setDetail(task.detail || ''); // 初期値として空文字を設定
        setIsDone(task.done || false); // 初期値として false を設定
        setDueDate(task.limit || ''); // 初期値として空文字を設定
        console.log('取得した期限日時:', task.dueDate); // 追加: デバッグ用ログ
      })
      .catch((err) => {
        setErrorMessage(`タスク情報の取得に失敗しました。${err}`);
      });
  }, [listId, taskId, cookies.token]);

  return (
    <div>
      <Header />
      <main className="edit-task">
        <h2>タスク編集</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="edit-task-form">
          <label>タイトル</label>
          <br />
          <input
            type="text"
            onChange={handleTitleChange}
            className="edit-task-title"
            value={title}
          />
          <br />
          <label>詳細</label>
          <br />
          <textarea
            type="text"
            onChange={handleDetailChange}
            className="edit-task-detail"
            value={detail}
          />
          <br />
          <div>
            <input
              type="radio"
              id="todo"
              name="status"
              value="todo"
              onChange={handleIsDoneChange}
              checked={!isDone}
            />
            未完了
            <input
              type="radio"
              id="done"
              name="status"
              value="done"
              onChange={handleIsDoneChange}
              checked={isDone}
            />
            完了
          </div>
          <label>期限</label>
          <br />
          <input
            type="datetime-local"
            onChange={handleDueDateChange}
            className="edit-task-dueDate"
            value={dueDate}
          />
          <button
            type="button"
            className="delete-task-button"
            onClick={onDeleteTask}
          >
            削除
          </button>
          <button
            type="button"
            className="edit-task-button"
            onClick={onUpdateTask}
          >
            更新
          </button>
        </form>
      </main>
    </div>
  );
};
