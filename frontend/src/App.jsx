import { useEffect, useState } from 'react';
import './App.css';

const API = 'http://localhost:8080/api';

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Cannot connect to the backend. Make sure Spring Boot is running.'
    );
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const fieldErrors = data?.fieldErrors
      ? Object.values(data.fieldErrors).join('. ')
      : '';

    const error = new Error(
      fieldErrors ||
        data?.message ||
        data?.error ||
        `Request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}
const emptyOrder = {
  productId: '',
  quantity: '1',
  totalPrice: '',
  status: 'PENDING',
};

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('orderToken') || ''
  );
  const [profile, setProfile] = useState(null);

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [orderForm, setOrderForm] = useState(emptyOrder);

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setProfile(null);
      return undefined;
    }

    let active = true;

    async function loadOrders() {
      setLoading(true);

      try {
        const [profileResult, result] = await Promise.all([
          apiRequest('/auth/me', { token }),
          apiRequest('/orders', { token }),
        ]);

        if (active) {
          setProfile(profileResult);
          setOrders(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        if (!active) return;

        if (error.status === 401) {
          localStorage.removeItem('orderToken');
          setToken('');
          setProfile(null);
          setOrders([]);
        }

        setNotice({
          type: 'error',
          text: error.message,
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [token]);

  function updateAuthForm(event) {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value,
    });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setWorking(true);
    setNotice({ type: '', text: '' });

    try {
         if (authMode === 'register') {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: {
            name: authForm.name.trim(),
            email: authForm.email.trim(),
            password: authForm.password,
          },
        });

        setAuthMode('login');
        setAuthForm({
          name: '',
          email: authForm.email.trim(),
          password: '',
        });

        setNotice({
          type: 'success',
          text: 'Account created. Please sign in.',
        });
      } else {
        const result = await apiRequest('/auth/login', {
          method: 'POST',
          body: {
            email: authForm.email.trim(),
            password: authForm.password,
          },
        });

        if (!result?.token) {
          throw new Error('Login did not return an authentication token.');
        }

        localStorage.setItem('orderToken', result.token);
        setToken(result.token);
        setAuthForm({ name: '', email: '', password: '' });
        setNotice({ type: '', text: '' });
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setWorking(false);
    }
  }

  function logout() {
    localStorage.removeItem('orderToken');
    setToken('');
    setProfile(null);
     setOrders([]);
    setNotice({ type: '', text: '' });
    setShowForm(false);
    setEditingId(null);
    setOrderForm(emptyOrder);
  }

  function openNewOrder() {
    setEditingId(null);
    setOrderForm(emptyOrder);
    setShowForm(true);
    setNotice({ type: '', text: '' });
  }

  function openEditOrder(order) {
    setEditingId(order.id);
    setOrderForm({
      productId: String(order.productId),
      quantity: String(order.quantity),
      totalPrice: String(order.totalPrice),
      status: order.status || 'PENDING',
    });
    setShowForm(true);
    setNotice({ type: '', text: '' });
  }

  async function submitOrder(event) {
    event.preventDefault();
    setWorking(true);
    setNotice({ type: '', text: '' });

    try {
      const body = {
        productId: Number(orderForm.productId),
        quantity: Number(orderForm.quantity),
        totalPrice: Number(orderForm.totalPrice),
        status: orderForm.status,
      };

      const wasCreating = editingId === null;

      await apiRequest(
        wasCreating ? '/orders' : `/orders/${editingId}`,
        {
          method: wasCreating ? 'POST' : 'PUT',
          body,
          token,
        }
      );

      const result = await apiRequest('/orders', { token });
      setOrders(Array.isArray(result) ? result : []);
      setShowForm(false);
      setEditingId(null);
      setOrderForm(emptyOrder);
      setNotice({
        type: 'success',
        text: wasCreating
          ? 'Order created successfully.'
          : 'Order updated successfully.',
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setWorking(false);
    }
  }

  async function deleteOrder(id) {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    setWorking(true);
    setNotice({ type: '', text: '' });

    try {
      await apiRequest(`/orders/${id}`, {
        method: 'DELETE',
        token,
      });

      const result = await apiRequest('/orders', { token });
      setOrders(Array.isArray(result) ? result : []);
      setNotice({ type: 'success', text: 'Order deleted successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Order Management home">
          <span className="brand-icon">O</span>
          <span>Order Management</span>
        </a>
   {token && (
          <button className="button button-light" onClick={logout}>
            Sign out
          </button>
        )}
      </header>

      <div className="content">
        {!token ? (
          <section className="auth-card">
            <p className="eyebrow">WELCOME</p>
            <h1>
              {authMode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="muted">
              {authMode === 'login'
                ? 'Sign in to manage your orders.'
                : 'Register to get started.'}
            </p>

            {notice.text && (
              <div className={`notice ${notice.type}`} role="alert">
                {notice.text}
              </div>
            )}

            <form onSubmit={submitAuth} className="form">
              {authMode === 'register' && (
                <label>
                  Full name
                  <input
                    name="name"
                    value={authForm.name}
                    onChange={updateAuthForm}
                    required
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={updateAuthForm}
                  required
                    autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={updateAuthForm}
                  required
                  minLength={authMode === 'register' ? 8 : undefined}
                  autoComplete={
                    authMode === 'login' ? 'current-password' : 'new-password'
                  }
                  placeholder="Enter your password"
                />
              </label>

              <button
                className="button button-primary button-full"
                disabled={working}
              >
                {working
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            <p className="switch-text">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setNotice({ type: '', text: '' });
                }}
              >
                {authMode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </section>
        ) : (
           <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">YOUR ACCOUNT</p>
                <h1>
                  {profile?.role === 'ADMIN' ? 'All orders' : 'My orders'}
                </h1>
                <p className="muted">
                  {profile?.role === 'ADMIN'
                    ? 'View orders from all users.'
                    : 'View and manage your orders in one place.'}
                </p>
              </div>

              <button
                className="button button-primary"
                onClick={openNewOrder}
                disabled={working}
              >
                + Add order
              </button>
            </section>

            {notice.text && (
              <div className={`notice ${notice.type}`} role="alert">
                {notice.text}
              </div>
            )}

            {showForm && (
              <section className="panel">
                <h2>{editingId === null ? 'New order' : 'Edit order'}</h2>

                <form onSubmit={submitOrder} className="form order-form">
                  <label>
                    Product ID
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={orderForm.productId}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, productId: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Quantity
                                        <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={orderForm.quantity}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, quantity: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Total price (₹)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={orderForm.totalPrice}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, totalPrice: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={orderForm.status}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, status: e.target.value })
                      }
                    >
                      {[
                        'PENDING',
                        'PROCESSING',
                        'SHIPPED',
                        'DELIVERED',
                        'CANCELLED',
                      ].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="button button-light"
                      onClick={() => setShowForm(false)}
                      disabled={working}
                    >
                      Cancel
                    </button>

                    <button className="button button-primary" disabled={working}>
                      {working ? 'Saving...' : 'Save order'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="orders-section">
              <div className="section-heading">
                <h2>
                  {profile?.role === 'ADMIN' ? 'All orders' : 'My orders'}
                </h2>
                <span className="count">{orders.length}</span>
              </div>

              {loading ? (
                <div className="empty-state">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <h3>No orders yet</h3>
                  <p className="muted">
                    Your orders will appear here after you add one.
                  </p>
                  <button
                    className="button button-primary"
                    onClick={openNewOrder}
                  >
                    Create your first order
                  </button>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-top">
                        <div>
                          <p className="order-id">Order #{order.id}</p>
                          <h3>Product {order.productId}</h3>
                        </div>
                        <span
                          className={`status status-${String(
                            order.status || 'PENDING'
                          ).toLowerCase()}`}
                        >
                          {order.status || 'PENDING'}
                        </span>
                      </div>

                      <div className="order-details">
                        <span>
                          Quantity: <strong>{order.quantity}</strong>
                        </span>
                        <span>
                          Total:{' '}
                          <strong>
                            ₹{Number(order.totalPrice).toFixed(2)}
                          </strong>
                        </span>
                      </div>

                      <div className="order-footer">
                        <span className="muted">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : 'Date unavailable'}
                        </span>

                        {profile &&
                          (profile.role !== 'ADMIN' ||
                            order.userId === profile.id) && (
                            <div className="actions">
                              <button
                                className="button button-light button-small"
                                onClick={() => openEditOrder(order)}
                                disabled={working}
                              >
                                Edit
                              </button>

                              <button
                                className="button button-danger button-small"
                                onClick={() => deleteOrder(order.id)}
                                disabled={working}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <footer className="footer">Order Management</footer>
    </main>
  );
}

export default App;

