'use client';

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { useAuth } from '@/hooks/useAuth';
import { useReservas } from '@/hooks/useReservas';
import { espaciosAPI, reservasAPI, usuariosAPI, reviewsAPI, favoritosAPI, chatAPI } from '@/lib/api';
import { useConversaciones } from '@/hooks/useChat';
import { ConversacionList } from '@/components/chat/ConversacionList';
import { MensajesConversacion } from '@/components/chat/MensajesConversacion';
import { CardEspacio } from '@/components/espacios/CardEspacio';
import { SeguridadChecklist } from '@/components/publicar/SeguridadChecklist';
import type { Espacio, Reserva } from '@/types';
import { MONEDAS } from '@/types';
import { StatsOferente } from '@/components/panel/StatsOferente';
import { EstadoReserva } from '@/components/reservas/EstadoReserva';
import { EstadoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { formatARS, formatFechaCorta, netoOferente } from '@/lib/utils';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { detectViolation, getViolationMessage } from '@/lib/contactFilter';
import { CalendarioDisponibilidad, type Disponibilidad } from '@/components/publicar/CalendarioDisponibilidad';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

const CATEGORIAS = [
  { value: 'cochera',    label: '🚗 Cochera' },
  { value: 'galpon',     label: '🏭 Galpón' },
  { value: 'local',      label: '🏪 Local' },
  { value: 'habitacion', label: '🛏️ Habitación' },
  { value: 'sotano',     label: '🏚️ Sótano' },
  { value: 'terraza',    label: '🌿 Terraza' },
  { value: 'abierto',    label: '🌳 Abierto' },
  { value: 'estante',    label: '📦 Estantería' },
];

export default function PanelPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const isOferente = user?.tipo === 'oferente' || user?.tipo === 'admin';
  const isAdmin = user?.tipo === 'admin';

  // Reservas propias (as demandante — for all users)
  const { reservas: misReservas, loading: misResLoading, cancelar, ocultar: ocultarReserva } = useReservas(token, 'mias');

  // Oferente-specific data
  const [misEspacios, setMisEspacios] = useState<Espacio[]>([]);
  const [reservasRecibidas, setReservasRecibidas] = useState<Reserva[]>([]);
  const [loadingOferente, setLoadingOferente] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Favoritos
  const [favoritos, setFavoritos] = useState<Espacio[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  // Chat / Mensajes
  const { conversaciones, loading: convLoading, recargar: recargarConvs } = useConversaciones(token);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const mensajesSectionRef = useRef<HTMLDivElement>(null);
  const [favLoading, setFavLoading] = useState(false);

  // Secciones desplegables
  const [openReservas, setOpenReservas] = useState(false);
  const [openFavoritos, setOpenFavoritos] = useState(false);
  const [openMensajes, setOpenMensajes] = useState(false);
  const [openConsultas, setOpenConsultas] = useState(false);
  const [openEspacios, setOpenEspacios] = useState(false);

  // Consultas públicas pendientes (oferente)
  interface ConsultaPendiente { id: number; espacio_id: string; espacio_nombre: string; autor_nombre: string; pregunta: string; created_at: string; }
  const [consultasPendientes, setConsultasPendientes] = useState<ConsultaPendiente[]>([]);
  const [respuestasMap, setRespuestasMap] = useState<Record<number, string>>({});
  const [respondiendo, setRespondiendo] = useState<number | null>(null);

  const cargarConsultasPendientes = useCallback(async () => {
    if (!token || !isOferente) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/consultas/mis-espacios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConsultasPendientes(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }, [token, isOferente]);

  // Edit modal
  const [editando, setEditando] = useState<Espacio | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '', descripcion: '', direccion: '',
    precio_dia: '', precio_mes: '', categoria: '', moneda: 'ARS',
    m2: '', lat: '', lng: '',
  });
  const editDireccionRef = useRef<HTMLInputElement>(null);

  // Profile edit
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombre: '', tel: '', dni: '', email: '', direccion: '', piso: '', departamento: '', lat: '', lng: '', pais: '', cbu_alias: '' });
  const [perfilAvatarFile, setPerfilAvatarFile] = useState<File | null>(null);
  const [perfilAvatarPreview, setPerfilAvatarPreview] = useState<string>('');
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [perfilError, setPerfilError] = useState('');
  const [perfilOk, setPerfilOk] = useState(false);
  const [perfilStep, setPerfilStep] = useState<'form' | 'otp_perfil'>('form');
  const [perfilOtpDigits, setPerfilOtpDigits] = useState(['', '', '', '', '', '']);
  const [perfilOtpEmailHint, setPerfilOtpEmailHint] = useState('');
  const perfilOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const perfilDireccionRef = useRef<HTMLInputElement>(null);
  const [editDisponibilidad, setEditDisponibilidad] = useState<Disponibilidad>({});
  const [editSeguridad, setEditSeguridad] = useState<Record<string, boolean>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'datos' | 'calendario' | 'seguridad'>('datos');

  // Extension modal
  const [extModal, setExtModal] = useState(false);
  const [extReservaId, setExtReservaId] = useState('');
  const [extEspacioNombre, setExtEspacioNombre] = useState('');
  const [extFechaHastaActual, setExtFechaHastaActual] = useState('');
  const [extNuevaFecha, setExtNuevaFecha] = useState('');
  const [extPrecio, setExtPrecio] = useState<number | null>(null);
  const [extDias, setExtDias] = useState(0);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState('');


  // Review modal
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewEspacioId, setReviewEspacioId] = useState('');
  const [reviewEspacioNombre, setReviewEspacioNombre] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTexto, setReviewTexto] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewOk, setReviewOk] = useState(false);

  async function handleResponderConsulta(consultaId: number) {
    const texto = respuestasMap[consultaId]?.trim();
    if (!texto || !token) return;
    setRespondiendo(consultaId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/consultas/${consultaId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ respuesta: texto }),
      });
      if (res.ok) {
        setRespuestasMap(m => { const n = { ...m }; delete n[consultaId]; return n; });
        await cargarConsultasPendientes();
      }
    } finally {
      setRespondiendo(null);
    }
  }

  async function handleAbrirChat(espacioId: string) {
    if (!token) return;
    setChatLoadingId(espacioId);
    try {
      const conv = await chatAPI.iniciarConversacion({ espacio_id: espacioId }, token);
      await recargarConvs();
      setSelectedConvId(conv.id);
      setTimeout(() => mensajesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (e: any) {
      alert(e?.message || 'No se pudo abrir el chat');
    } finally {
      setChatLoadingId(null);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  const cargarDatosOferente = useCallback(async () => {
    if (!isOferente || !token) return;
    setLoadingOferente(true);
    try {
      const [espacios, recibidas] = await Promise.all([
        espaciosAPI.misEspacios(token),
        reservasAPI.recibidas(token),
      ]);
      setMisEspacios(espacios);
      setReservasRecibidas(recibidas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOferente(false);
    }
  }, [isOferente, token]);

  useEffect(() => { cargarDatosOferente(); }, [cargarDatosOferente, refreshKey]);
  useEffect(() => { cargarConsultasPendientes(); }, [cargarConsultasPendientes]);

  const cargarFavoritos = useCallback(async () => {
    if (!token) return;
    setFavLoading(true);
    try {
      const data = await favoritosAPI.listar(token);
      setFavoritos(data);
      setFavIds(new Set(data.map(e => e.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  }, [token]);

  useEffect(() => { cargarFavoritos(); }, [cargarFavoritos]);

  function handleToggleFavoritoPanel(id: string, val: boolean) {
    setFavIds(prev => {
      const next = new Set(prev);
      if (val) next.add(id); else next.delete(id);
      return next;
    });
    if (!val) setFavoritos(prev => prev.filter(e => e.id !== id));
  }

  async function handleToggleDisponible(id: string, disponible: boolean) {
    if (!token) return;
    const esp = misEspacios.find(e => e.id === id);
    if (!esp) return;
    try {
      await espaciosAPI.actualizar(id, {
        nombre: esp.nombre, direccion: esp.direccion, barrio: esp.barrio,
        m2: esp.m2, tipo: esp.tipo, precio_dia: esp.precio_dia, precio_mes: esp.precio_mes,
        descripcion: esp.descripcion || '', lat: esp.lat, lng: esp.lng,
        disponible,
      }, token);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  }

  function abrirEditar(esp: Espacio) {
    setEditando(esp);
    setEditForm({
      nombre: esp.nombre || '',
      descripcion: esp.descripcion || '',
      direccion: esp.direccion || '',
      precio_dia: String(esp.precio_dia || ''),
      precio_mes: String(esp.precio_mes || ''),
      categoria: (esp as any).categoria || '',
      moneda: esp.moneda || 'ARS',
      m2: esp.m2 ? String(esp.m2) : '',
      lat: esp.lat ? String(esp.lat) : '',
      lng: esp.lng ? String(esp.lng) : '',
    });
    setEditDisponibilidad((esp as any).disponibilidad || {});
    setEditSeguridad((esp as any).seguridad || {});
    setEditError(null);
    setEditTab('datos');
  }

  function abrirPerfil() {
    setPerfilAvatarFile(null);
    setPerfilAvatarPreview(user?.avatar_url || '');
    setPerfilForm({
      nombre: user?.nombre || '',
      tel: user?.tel || '',
      dni: user?.dni || '',
      email: user?.email || '',
      direccion: user?.direccion || '',
      piso: (user as any)?.piso || '',
      departamento: (user as any)?.departamento || '',
      lat: user?.lat ? String(user.lat) : '',
      lng: user?.lng ? String(user.lng) : '',
      pais: (user as any)?.pais || '',
      cbu_alias: user?.cbu_alias || '',
    });
    setPerfilError('');
    setPerfilOk(false);
    setPerfilStep('form');
    setPerfilOtpDigits(['', '', '', '', '', '']);
    setPerfilOpen(true);
  }

  // Google Maps autocomplete for profile address
  useEffect(() => {
    if (!perfilOpen || !MAPS_KEY) return;

    // Elevar z-index del dropdown de Google Maps sobre el modal
    const style = document.createElement('style');
    style.id = 'pac-fix';
    style.textContent = '.pac-container { z-index: 99999 !important; }';
    document.head.appendChild(style);

    // Esperar a que el modal termine de renderizar antes de buscar el ref
    const timer = setTimeout(() => {
      if (!perfilDireccionRef.current) return;
      const loader = new Loader({ apiKey: MAPS_KEY, version: 'weekly' });
      loader.load().then(async (google) => {
        if (!perfilDireccionRef.current) return;
        const { Autocomplete } = await google.maps.importLibrary('places') as any;
        const ac = new Autocomplete(perfilDireccionRef.current, {
          fields: ['formatted_address', 'geometry', 'address_components'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;
          const countryComp = place.address_components?.find(
            (c: any) => c.types.includes('country')
          );
          const pais = countryComp?.long_name || '';
          setPerfilForm(f => ({
            ...f,
            direccion: place.formatted_address || f.direccion,
            lat: String(place.geometry.location.lat()),
            lng: String(place.geometry.location.lng()),
            pais,
          }));
        });
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      document.getElementById('pac-fix')?.remove();
    };
  }, [perfilOpen]);

  // Google Maps autocomplete for edit espacio address
  useEffect(() => {
    if (!editando || !MAPS_KEY) return;
    const style = document.createElement('style');
    style.id = 'pac-fix-edit';
    style.textContent = '.pac-container { z-index: 99999 !important; }';
    document.head.appendChild(style);
    const timer = setTimeout(() => {
      if (!editDireccionRef.current) return;
      const loader = new Loader({ apiKey: MAPS_KEY, version: 'weekly' });
      loader.load().then(async (google) => {
        if (!editDireccionRef.current) return;
        const { Autocomplete } = await google.maps.importLibrary('places') as any;
        const ac = new Autocomplete(editDireccionRef.current, {
          fields: ['formatted_address', 'geometry'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;
          setEditForm(f => ({
            ...f,
            direccion: place.formatted_address || f.direccion,
            lat: String(place.geometry.location.lat()),
            lng: String(place.geometry.location.lng()),
          }));
        });
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      document.getElementById('pac-fix-edit')?.remove();
    };
  }, [editando]);

  async function handleGuardarPerfil() {
    if (!token) return;
    if (!perfilForm.nombre.trim()) { setPerfilError('El nombre es obligatorio'); return; }
    setPerfilLoading(true);
    setPerfilError('');
    try {
      if (perfilAvatarFile) {
        await usuariosAPI.subirAvatar(perfilAvatarFile, token);
      }
      const res = await usuariosAPI.solicitarCambioPerfil(token);
      setPerfilOtpEmailHint(res.email_hint);
      setPerfilStep('otp_perfil');
      setPerfilOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => perfilOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setPerfilError(err instanceof Error ? err.message : 'Error al enviar el código');
    } finally {
      setPerfilLoading(false);
    }
  }

  function handlePerfilOtpChange(idx: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...perfilOtpDigits];
    next[idx] = v;
    setPerfilOtpDigits(next);
    if (v && idx < 5) perfilOtpRefs.current[idx + 1]?.focus();
    if (v && next.every(d => d !== '')) handleVerificarCambioPerfil(next.join(''));
  }

  function handlePerfilOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !perfilOtpDigits[idx] && idx > 0) {
      perfilOtpRefs.current[idx - 1]?.focus();
    }
  }

  function handlePerfilOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...perfilOtpDigits];
    text.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setPerfilOtpDigits(next);
    const lastFilled = Math.min(text.length, 5);
    perfilOtpRefs.current[lastFilled]?.focus();
    if (text.length === 6) handleVerificarCambioPerfil(text);
  }

  async function handleVerificarCambioPerfil(codigo: string) {
    if (!token) return;
    setPerfilLoading(true);
    setPerfilError('');
    try {
      await usuariosAPI.verificarCambioPerfil(codigo, token);
      // OTP válido → guardar todos los cambios del perfil
      await usuariosAPI.actualizar({
        nombre: perfilForm.nombre,
        tel: perfilForm.tel || undefined,
        dni: perfilForm.dni || undefined,
        email: perfilForm.email || undefined,
        direccion: perfilForm.direccion || undefined,
        piso: perfilForm.piso || undefined,
        departamento: perfilForm.departamento || undefined,
        pais: perfilForm.pais || undefined,
        lat: perfilForm.lat ? Number(perfilForm.lat) : undefined,
        lng: perfilForm.lng ? Number(perfilForm.lng) : undefined,
        cbu_alias: perfilForm.cbu_alias || undefined,
      }, token);
      await refreshUser();
      setPerfilOk(true);
      setTimeout(() => setPerfilOpen(false), 1500);
    } catch (err) {
      setPerfilError(err instanceof Error ? err.message : 'Código incorrecto');
      setPerfilOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => perfilOtpRefs.current[0]?.focus(), 50);
    } finally {
      setPerfilLoading(false);
    }
  }

  async function handleReactivarEspacio(id: string) {
    if (!token) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/espacios/${id}/reactivar`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGuardarEdicion() {
    if (!token || !editando) return;
    if (!editForm.nombre.trim()) { setEditError('El nombre es obligatorio'); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      await espaciosAPI.actualizar(editando.id, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        direccion: editForm.direccion,
        barrio: editando.barrio,
        precio_dia: Number(editForm.precio_dia) || 0,
        precio_mes: Number(editForm.precio_mes) || 0,
        m2: editForm.m2 ? Number(editForm.m2) : undefined,
        tipo: editando.tipo,
        lat: editForm.lat ? Number(editForm.lat) : editando.lat,
        lng: editForm.lng ? Number(editForm.lng) : editando.lng,
        moneda: editForm.moneda || 'ARS',
        categoria: editForm.categoria || undefined,
        disponibilidad: editDisponibilidad,
        seguridad: editSeguridad,
      }, token);
      setEditando(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  }

  function abrirExtension(r: { id: string; espacio_nombre?: string; fecha_hasta: string }) {
    setExtReservaId(r.id);
    setExtEspacioNombre(r.espacio_nombre || '');
    setExtFechaHastaActual(r.fecha_hasta ? String(r.fecha_hasta).slice(0, 10) : '');
    setExtNuevaFecha('');
    setExtPrecio(null);
    setExtDias(0);
    setExtError('');
    setExtModal(true);
  }

  async function calcularExtension(nuevaFecha: string) {
    setExtNuevaFecha(nuevaFecha);
    if (!nuevaFecha || nuevaFecha <= extFechaHastaActual) { setExtPrecio(null); return; }
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reservas/${extReservaId}/extender`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nueva_fecha_hasta: nuevaFecha, _preview: true }),
        }
      );
      // Only use for preview — backend will ignore _preview and return price anyway
      // We just show the price from the response without creating the extension yet
      // Actually we'll create it on confirm. For now, calculate locally:
      const desde = new Date(extFechaHastaActual);
      const hasta  = new Date(nuevaFecha);
      const dias   = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
      setExtDias(dias);
      // We'll get exact price from backend on submit
      setExtPrecio(null); // will be shown after submit
    } catch { /* ignore */ }
  }

  async function handleExtender() {
    if (!token || !extNuevaFecha || extNuevaFecha <= extFechaHastaActual) return;
    setExtLoading(true);
    setExtError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reservas/${extReservaId}/extender`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nueva_fecha_hasta: extNuevaFecha }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear extensión');
      setExtModal(false);
      // Redirect to MP checkout for the extension
      window.location.href = data.init_point;
    } catch (err) {
      setExtError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setExtLoading(false);
    }
  }

  function abrirReview(r: { espacio_id: string; espacio_nombre?: string }) {
    setReviewEspacioId(r.espacio_id);
    setReviewEspacioNombre(r.espacio_nombre || '');
    setReviewRating(0);
    setReviewTexto('');
    setReviewError('');
    setReviewOk(false);
    setReviewModal(true);
  }

  async function handleEnviarReview() {
    if (!token || !reviewRating) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      await reviewsAPI.crear({ espacio_id: reviewEspacioId, rating: reviewRating, texto: reviewTexto }, token);
      setReviewOk(true);
      setTimeout(() => setReviewModal(false), 1800);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleEliminarEspacio(id: string) {
    if (!token) return;
    if (!window.confirm('¿Querés dar de baja esta publicación?\n\nVa a dejar de aparecer en el mapa y en las búsquedas.')) return;
    if (!window.confirm('Segunda confirmación: ¿estás seguro? La publicación quedará desactivada de forma permanente.')) return;
    try {
      await espaciosAPI.eliminar(id, token);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  }

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>
        Cargando…
      </div>
    );
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />

      <div className="page-scroll">
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Welcome */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '.3rem' }}>
                Hola, {user.nombre.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '.92rem' }}>
                {isOferente
                  ? 'Gestioná tus espacios y reservas desde acá.'
                  : 'Revisá el estado de tus reservas y encontrá nuevos espacios.'}
              </p>
              {user.direccion && (
                <p style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.25rem' }}>
                  📍 {user.direccion}
                </p>
              )}
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '.8rem', padding: '.4rem .9rem', whiteSpace: 'nowrap' }}
              onClick={abrirPerfil}
            >
              ✏️ Editar perfil
            </button>
          </div>

          {/* Stats — oferente only */}
          {isOferente && (
            <div style={{ marginBottom: '2rem' }}>
              <StatsOferente espacios={misEspacios} reservas={reservasRecibidas} />
            </div>
          )}

          {/* ── SECTION 1: Mis reservas realizadas ── */}
          <section style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setOpenReservas(v => !v)}
              className="seccion-toggle"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span>📅 Mis reservas realizadas</span>
                {!misResLoading && (
                  <span className="pill pill--gray" style={{ fontSize: '.7rem', padding: '.1rem .45rem' }}>
                    {misReservas.length}
                  </span>
                )}
              </span>
              <span className={`seccion-chevron${openReservas ? ' open' : ''}`}>▾</span>
            </button>

            <div className={`seccion-body${openReservas ? ' open' : ''}`}>
              <div style={{ paddingTop: '.75rem' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
                    🔍 Buscar espacios
                  </Button>
                </div>
                {misResLoading ? (
                  <p style={{ color: 'var(--text3)' }}>Cargando…</p>
                ) : misReservas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📦</div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.3rem' }}>No tenés reservas aún</div>
                    <p style={{ fontSize: '.85rem' }}>Explorá espacios disponibles en Buenos Aires.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '.85rem' }}>
                    {misReservas.map(r => (
                      <EstadoReserva
                        key={r.id}
                        reserva={r}
                        onCancelar={!['cancelada', 'finalizada'].includes(r.estado) ? () => cancelar(r.id) : undefined}
                        onPagar={r.estado === 'confirmada' ? () => router.push(`/reserva/${r.id}/checkout`) : undefined}
                        onCalificar={['pagada', 'finalizada'].includes(r.estado) ? () => abrirReview(r) : undefined}
                        onExtender={r.estado === 'pagada' ? () => abrirExtension(r) : undefined}
                        onEliminar={['cancelada', 'finalizada'].includes(r.estado) ? () => ocultarReserva(r.id) : undefined}
                        onChat={['pagada', 'finalizada'].includes(r.estado) ? () => handleAbrirChat(r.espacio_id) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION: Mis favoritos ── */}
          <section style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setOpenFavoritos(v => !v)}
              className="seccion-toggle"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span>❤️ Mis favoritos</span>
                {!favLoading && (
                  <span className="pill pill--gray" style={{ fontSize: '.7rem', padding: '.1rem .45rem' }}>
                    {favoritos.length}
                  </span>
                )}
              </span>
              <span className={`seccion-chevron${openFavoritos ? ' open' : ''}`}>▾</span>
            </button>

            <div className={`seccion-body${openFavoritos ? ' open' : ''}`}>
              <div style={{ paddingTop: '.75rem' }}>
                {favLoading ? (
                  <p style={{ color: 'var(--text3)' }}>Cargando…</p>
                ) : favoritos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🤍</div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.3rem' }}>No tenés favoritos guardados</div>
                    <p style={{ fontSize: '.85rem' }}>Tocá el corazón en una publicación para guardarla acá.</p>
                  </div>
                ) : (
                  <div className="espacios-grid">
                    {favoritos.map(e => (
                      <CardEspacio
                        key={e.id}
                        espacio={e}
                        isFavorito={favIds.has(e.id)}
                        onToggleFavorito={handleToggleFavoritoPanel}
                        token={token}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION: Mensajes ── */}
          <section style={{ marginBottom: '1.5rem' }} ref={mensajesSectionRef}>
            <button onClick={() => setOpenMensajes(v => !v)} className="seccion-toggle">
              <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span>💬 Mensajes</span>
                {conversaciones.some(c => (c.no_leidos ?? 0) > 0) && (
                  <span className="pill pill--gray" style={{ fontSize: '.7rem', padding: '.1rem .45rem', background: 'var(--orange)', color: '#fff' }}>
                    {conversaciones.reduce((acc, c) => acc + (c.no_leidos ?? 0), 0)}
                  </span>
                )}
              </span>
              <span className={`seccion-chevron${openMensajes ? ' open' : ''}`}>▾</span>
            </button>
            <div className={`seccion-body${openMensajes ? ' open' : ''}`}>
              <div style={{ paddingTop: '.75rem' }}>
                {convLoading ? (
                  <p style={{ color: 'var(--text3)' }}>Cargando…</p>
                ) : conversaciones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>💬</div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.3rem' }}>No tenés conversaciones aún</div>
                    <p style={{ fontSize: '.85rem' }}>El chat se habilita automáticamente cuando completás un pago.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: selectedConvId ? '280px 1fr' : '1fr', gap: '1rem', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ borderRight: selectedConvId ? '1px solid var(--border)' : 'none' }}>
                      <ConversacionList
                        conversaciones={conversaciones}
                        selectedId={selectedConvId}
                        onSelect={c => setSelectedConvId(c.id)}
                        userId={user?.id ?? ''}
                      />
                    </div>
                    {selectedConvId && token && user && (
                      <MensajesConversacion
                        conversacionId={selectedConvId}
                        token={token}
                        userId={user.id}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION: Consultas pendientes (oferente only) ── */}
          {isOferente && (
            <section style={{ marginBottom: '1.5rem' }}>
              <button onClick={() => setOpenConsultas(v => !v)} className="seccion-toggle">
                <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span>❓ Consultas pendientes</span>
                  {consultasPendientes.length > 0 && (
                    <span className="pill pill--gray" style={{ fontSize: '.7rem', padding: '.1rem .45rem', background: 'var(--orange)', color: '#fff' }}>
                      {consultasPendientes.length}
                    </span>
                  )}
                </span>
                <span className={`seccion-chevron${openConsultas ? ' open' : ''}`}>▾</span>
              </button>
              <div className={`seccion-body${openConsultas ? ' open' : ''}`}>
                <div style={{ paddingTop: '.75rem' }}>
                  {consultasPendientes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)', fontSize: '.85rem' }}>
                      ✅ No hay consultas pendientes de respuesta
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '.85rem' }}>
                      {consultasPendientes.map(c => (
                        <div key={c.id} style={{ background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '1rem', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: '.35rem' }}>
                            📦 {c.espacio_nombre}
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                            <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--orange)', background: 'rgba(232,98,42,.1)', borderRadius: '99px', padding: '.15rem .55rem', whiteSpace: 'nowrap' }}>
                              {c.autor_nombre}
                            </span>
                            <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.5 }}>{c.pregunta}</p>
                          </div>
                          <textarea
                            value={respuestasMap[c.id] || ''}
                            onChange={e => {
                              const val = e.target.value;
                              const v = detectViolation(val);
                              if (v) { alert(getViolationMessage(v)); return; }
                              setRespuestasMap(m => ({ ...m, [c.id]: val }));
                            }}
                            placeholder="Escribí tu respuesta…"
                            rows={2}
                            style={{ width: '100%', resize: 'vertical', fontSize: '.85rem', padding: '.5rem .7rem', borderRadius: 'var(--r2)', background: 'var(--surface2)', border: '1.5px solid var(--border)', boxSizing: 'border-box', marginBottom: '.5rem' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              size="sm"
                              onClick={() => handleResponderConsulta(c.id)}
                              loading={respondiendo === c.id}
                              disabled={!respuestasMap[c.id]?.trim()}
                            >
                              Responder →
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── SECTION 2: Mis espacios publicados (oferente only) ── */}
          {isOferente && (
            <section style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={() => setOpenEspacios(v => !v)}
                className="seccion-toggle"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span>🏠 Mis espacios publicados</span>
                  {!loadingOferente && (
                    <span className="pill pill--gray" style={{ fontSize: '.7rem', padding: '.1rem .45rem' }}>
                      {misEspacios.length}
                    </span>
                  )}
                </span>
                <span className={`seccion-chevron${openEspacios ? ' open' : ''}`}>▾</span>
              </button>

              <div className={`seccion-body${openEspacios ? ' open' : ''}`}>
                <div style={{ paddingTop: '.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <Button variant="primary" size="sm" onClick={() => router.push('/publicar')}>
                    ➕ Publicar espacio
                  </Button>
                </div>

              {loadingOferente ? (
                <p style={{ color: 'var(--text3)' }}>Cargando…</p>
              ) : misEspacios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📦</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.4rem' }}>No tenés espacios publicados</div>
                  <p style={{ fontSize: '.88rem' }}>Publicá tu primer espacio y empezá a recibir reservas.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.2rem' }}>
                  {misEspacios.map(esp => {
                    const reservasEsp = reservasRecibidas.filter(r => r.espacio_id === esp.id);
                    const esVencida = !!esp.vencida;
                    const diasRestantes = esp.fecha_vencimiento && !esVencida
                      ? Math.ceil((new Date(esp.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const proximaAVencer = diasRestantes !== null && diasRestantes <= 30;
                    return (
                      <div key={esp.id} style={{ background: 'var(--surface)', border: `1px solid ${esVencida ? 'rgba(239,68,68,.4)' : 'var(--border)'}`, borderRadius: 'var(--r2)', overflow: 'hidden', opacity: esVencida ? .85 : 1 }}>
                        {/* Banner vencida */}
                        {esVencida && (
                          <div style={{ background: 'rgba(239,68,68,.12)', borderBottom: '1px solid rgba(239,68,68,.25)', padding: '.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#f87171' }}>
                              🔴 Publicación vencida — venció el {esp.fecha_vencimiento ? new Date(esp.fecha_vencimiento).toLocaleDateString('es-AR') : ''}
                            </span>
                            <a href="/publicar" style={{ fontSize: '.75rem', color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}>
                              + Publicar de nuevo
                            </a>
                          </div>
                        )}
                        {/* Banner próxima a vencer */}
                        {proximaAVencer && (
                          <div style={{ background: 'rgba(245,158,11,.1)', borderBottom: '1px solid rgba(245,158,11,.25)', padding: '.4rem 1rem' }}>
                            <span style={{ fontSize: '.76rem', fontWeight: 700, color: '#f59e0b' }}>
                              ⚠️ Vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''} ({new Date(esp.fecha_vencimiento!).toLocaleDateString('es-AR')})
                            </span>
                          </div>
                        )}
                        {/* Space info row */}
                        <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          {esp.img_principal && (
                            <img
                              src={esp.img_principal}
                              alt={esp.nombre}
                              style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--r1)', flexShrink: 0 }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>{esp.nombre}</div>
                            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.15rem' }}>
                              📍 {esp.barrio}{Number(esp.m2) > 0 ? ` · ${esp.m2} m²` : ''}
                            </div>
                            <div style={{ fontSize: '.82rem', fontWeight: 700, marginTop: '.2rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                              {esp.precio_dia > 0 && <span style={{ color: 'var(--orange)' }}>{formatARS(esp.precio_dia)}/día</span>}
                              {esp.precio_mes > 0 && <span style={{ color: 'var(--orange)' }}>{formatARS(esp.precio_mes)}/mes</span>}
                            </div>
                            {esp.fecha_vencimiento && !esVencida && !proximaAVencer && (
                              <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: '.2rem' }}>
                                📅 Vence el {new Date(esp.fecha_vencimiento).toLocaleDateString('es-AR')}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
                            {esVencida ? (
                              <span style={{ fontSize: '.72rem', background: 'rgba(239,68,68,.15)', color: '#f87171', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r1)', padding: '.2rem .6rem', fontWeight: 700 }}>
                                🔴 Vencida
                              </span>
                            ) : esp.inactiva_auto ? (
                              <span style={{ fontSize: '.72rem', background: 'rgba(239,68,68,.15)', color: '#f87171', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r1)', padding: '.2rem .6rem', fontWeight: 700 }}>
                                ⏸️ Pausada por inactividad
                              </span>
                            ) : (
                              <span className={`pill ${esp.disponible ? 'pill--green' : 'pill--gray'}`}>
                                {esp.disponible ? '✅ Activo' : '⏸️ Inactivo'}
                              </span>
                            )}
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              {esVencida ? (
                                <a href="/publicar" className="btn-ghost" style={{ fontSize: '.73rem', color: 'var(--orange)', fontWeight: 700 }}>
                                  + Publicar de nuevo
                                </a>
                              ) : esp.inactiva_auto ? (
                                <button
                                  className="btn-ghost"
                                  style={{ fontSize: '.73rem', color: 'var(--mint)', fontWeight: 700 }}
                                  onClick={() => handleReactivarEspacio(esp.id)}
                                >
                                  ▶ Reactivar
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="btn-ghost"
                                    style={{ fontSize: '.73rem', color: 'var(--orange)' }}
                                    onClick={() => abrirEditar(esp)}
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    className="btn-ghost"
                                    style={{ fontSize: '.73rem' }}
                                    onClick={() => handleToggleDisponible(esp.id, !esp.disponible)}
                                  >
                                    {esp.disponible ? 'Pausar' : 'Activar'}
                                  </button>
                                </>
                              )}
                              {!esVencida && (
                                <button
                                  className="btn-ghost"
                                  style={{ fontSize: '.73rem', color: 'var(--red)' }}
                                  onClick={() => handleEliminarEspacio(esp.id)}
                                >
                                  Borrar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reservations received for this space */}
                        {reservasEsp.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border)', padding: '.6rem 1rem .8rem' }}>
                            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>
                              Reservas recibidas ({reservasEsp.length})
                            </div>
                            <div style={{ display: 'grid', gap: '.6rem' }}>
                              {reservasEsp.map(r => {
                                const diasHastaInicio = Math.ceil((new Date(r.fecha_desde).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                const esPagada = r.estado === 'pagada';
                                const esActiva = ['pagada', 'confirmada'].includes(r.estado);
                                const iniciaHoy = diasHastaInicio === 0;
                                const iniciaMañana = diasHastaInicio === 1;
                                const iniciaProximo = diasHastaInicio > 1 && diasHastaInicio <= 7;
                                const yaComenzo = diasHastaInicio < 0 && esPagada;
                                return (
                                  <div key={r.id} style={{ background: 'var(--surface2)', borderRadius: 'var(--r1)', overflow: 'hidden', border: esPagada ? '1px solid rgba(34,197,94,.25)' : '1px solid transparent' }}>
                                    {/* Alerta disponibilidad */}
                                    {esPagada && (iniciaHoy || iniciaMañana || iniciaProximo) && (
                                      <div style={{ background: iniciaHoy || iniciaMañana ? 'rgba(232,98,42,.12)' : 'rgba(245,158,11,.08)', borderBottom: `1px solid ${iniciaHoy || iniciaMañana ? 'rgba(232,98,42,.25)' : 'rgba(245,158,11,.2)'}`, padding: '.35rem .8rem', fontSize: '.73rem', fontWeight: 700, color: iniciaHoy || iniciaMañana ? 'var(--orange)' : '#f59e0b' }}>
                                        {iniciaHoy ? '🔔 ¡El espacio debe estar disponible HOY!' : iniciaMañana ? '🔔 Disponibilizá el espacio mañana' : `🗓️ Disponibilizá el espacio en ${diasHastaInicio} días (${formatFechaCorta(r.fecha_desde)})`}
                                      </div>
                                    )}
                                    {esPagada && yaComenzo && (
                                      <div style={{ background: 'rgba(34,197,94,.08)', borderBottom: '1px solid rgba(34,197,94,.2)', padding: '.35rem .8rem', fontSize: '.73rem', fontWeight: 700, color: 'var(--mint)' }}>
                                        ✅ Reserva en curso — finaliza el {formatFechaCorta(r.fecha_hasta)}
                                      </div>
                                    )}
                                    {/* Contenido */}
                                    <div style={{ padding: '.6rem .8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '.86rem' }}>{r.usuario_nombre}</div>
                                        {esActiva && r.usuario_email && (
                                          <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                                            ✉️ {r.usuario_email}{r.usuario_tel ? ` · 📞 ${r.usuario_tel}` : ''}
                                          </div>
                                        )}
                                        <div style={{ fontSize: '.76rem', color: 'var(--text2)', marginTop: '.2rem', fontWeight: 600 }}>
                                          📅 {formatFechaCorta(r.fecha_desde)} → {formatFechaCorta(r.fecha_hasta)}
                                        </div>
                                        {r.pin_acceso && esActiva && (
                                          <div style={{ marginTop: '.2rem', fontSize: '.73rem' }}>
                                            🔑 PIN de acceso: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--orange)', letterSpacing: '.1em' }}>{r.pin_acceso}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.25rem', flexShrink: 0 }}>
                                        <EstadoBadge estado={r.estado} />
                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: '.67rem', color: 'var(--text3)' }}>Recibís (neto)</div>
                                          <div style={{ fontSize: '.9rem', fontWeight: 700, color: esPagada ? 'var(--mint)' : 'var(--text3)' }}>
                                            {formatARS(netoOferente(r.precio_total))}
                                          </div>
                                        </div>
                                        {['pagada', 'finalizada'].includes(r.estado) && (
                                          <button
                                            className="btn-secondary"
                                            style={{ fontSize: '.72rem', padding: '.2rem .6rem', borderRadius: 'var(--r1)' }}
                                            onClick={() => {
                                              setSelectedConvId(null);
                                              recargarConvs().then(() => {
                                                const conv = conversaciones.find(c => c.espacio_id === r.espacio_id && c.demandante_id === r.usuario_id);
                                                if (conv) {
                                                  setSelectedConvId(conv.id);
                                                  mensajesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                              });
                                            }}
                                          >
                                            💬 Chat
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
      {/* Modal perfil */}
      <Modal
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        title={perfilStep === 'otp_perfil' ? '📧 Verificá tu identidad' : '✏️ Editar perfil'}
        subtitle={perfilStep === 'otp_perfil' ? 'Ingresá el código que enviamos a tu email' : 'Actualizá tus datos personales y tu dirección'}
        maxWidth="500px"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          {perfilOk ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Perfil actualizado</div>
            </div>
          ) : perfilStep === 'otp_perfil' ? (
            <>
              <p style={{ color: 'var(--text2)', fontSize: '.88rem', textAlign: 'center', margin: 0 }}>
                Enviamos un código de 6 dígitos al email{' '}
                <strong style={{ color: 'var(--text)' }}>{perfilOtpEmailHint}</strong>
              </p>
              <div style={{
                background: 'rgba(232,98,42,.08)', border: '1px solid rgba(232,98,42,.2)',
                borderRadius: 'var(--r2)', padding: '.5rem .9rem',
                fontSize: '.78rem', color: 'var(--text2)', textAlign: 'center',
              }}>
                ⏱️ Tenés <strong>10 minutos</strong> para ingresar el código antes de que expire.
                Revisá también la carpeta de spam.
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
                {perfilOtpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { perfilOtpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handlePerfilOtpChange(i, e.target.value)}
                    onKeyDown={e => handlePerfilOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handlePerfilOtpPaste : undefined}
                    disabled={perfilLoading}
                    style={{
                      width: 46, height: 56, textAlign: 'center',
                      fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace',
                      borderRadius: 'var(--r2)',
                      border: `2px solid ${d ? 'var(--orange)' : 'var(--border)'}`,
                      background: d ? 'rgba(232,98,42,.08)' : 'var(--surface2)',
                      color: 'var(--text)', outline: 'none',
                      cursor: perfilLoading ? 'not-allowed' : 'text',
                      opacity: perfilLoading ? .6 : 1,
                    }}
                  />
                ))}
              </div>
              {perfilError && <div className="alert alert--error">{perfilError}</div>}
              <Button
                onClick={() => handleVerificarCambioPerfil(perfilOtpDigits.join(''))}
                loading={perfilLoading}
                disabled={perfilOtpDigits.some(d => !d) || perfilLoading}
                style={{ width: '100%' }}
              >
                Verificar y guardar cambios
              </Button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setPerfilStep('form')}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.82rem', cursor: 'pointer' }}
                >
                  ← Volver al formulario
                </button>
                <button
                  type="button"
                  onClick={handleGuardarPerfil}
                  disabled={perfilLoading}
                  style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '.82rem', cursor: 'pointer', opacity: perfilLoading ? .5 : 1 }}
                >
                  Reenviar código
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'var(--surface2)', border: '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                }}>
                  {perfilAvatarPreview
                    ? <img src={perfilAvatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👤'
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Foto de perfil (opcional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPerfilAvatarFile(file);
                      setPerfilAvatarPreview(URL.createObjectURL(file));
                    }}
                    style={{ fontSize: '.8rem' }}
                  />
                </div>
              </div>

              {/* Nombre + DNI */}
              <div className="form-row">
                <div>
                  <label className="form-label">Nombre *</label>
                  <input value={perfilForm.nombre}
                    onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="form-label">DNI</label>
                  <input value={perfilForm.dni}
                    onChange={e => setPerfilForm(f => ({ ...f, dni: e.target.value }))}
                    placeholder="12345678" maxLength={20} />
                </div>
              </div>

              {/* Email + Teléfono */}
              <div className="form-row">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={perfilForm.email}
                    onChange={e => setPerfilForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input value={perfilForm.tel}
                    onChange={e => setPerfilForm(f => ({ ...f, tel: e.target.value }))}
                    placeholder="+54 9 11 ..." />
                </div>
              </div>

              {/* Dirección + País */}
              <div>
                <label className="form-label">Dirección personal</label>
                <input
                  ref={perfilDireccionRef}
                  value={perfilForm.direccion}
                  onChange={e => setPerfilForm(f => ({ ...f, direccion: e.target.value, lat: '', lng: '', pais: '' }))}
                  placeholder="Escribí tu dirección para autocompletar…"
                />
                {perfilForm.lat && (
                  <div style={{ fontSize: '.73rem', color: 'var(--mint)', marginTop: '.3rem' }}>
                    ✅ Ubicación guardada — el mapa te centrará automáticamente al iniciar sesión
                  </div>
                )}
                {perfilForm.direccion && !perfilForm.lat && (
                  <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.3rem' }}>
                    💡 Seleccioná una opción del autocompletado para guardar la ubicación exacta
                  </div>
                )}
              </div>

              {/* Piso y Departamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Piso</label>
                  <input
                    value={perfilForm.piso}
                    onChange={e => setPerfilForm(f => ({ ...f, piso: e.target.value }))}
                    placeholder="Ej: 3"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="form-label">Departamento</label>
                  <input
                    value={perfilForm.departamento}
                    onChange={e => setPerfilForm(f => ({ ...f, departamento: e.target.value }))}
                    placeholder="Ej: B"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* País — se completa automáticamente con la dirección */}
              <div>
                <label className="form-label">País</label>
                <input
                  value={perfilForm.pais}
                  onChange={e => setPerfilForm(f => ({ ...f, pais: e.target.value }))}
                  placeholder="Se completa al seleccionar dirección…"
                />
              </div>

              {/* CBU/Alias — solo para oferentes */}
              {isOferente && (
                <div>
                  <label className="form-label">
                    CBU / Alias bancario
                    {isOferente && !perfilForm.cbu_alias && (
                      <span style={{ fontSize: '.7rem', color: 'var(--amber)', marginLeft: '.4rem' }}>
                        ⚠️ Requerido para recibir pagos
                      </span>
                    )}
                  </label>
                  <input
                    value={perfilForm.cbu_alias}
                    onChange={e => setPerfilForm(f => ({ ...f, cbu_alias: e.target.value }))}
                    placeholder="Ej: 0000003100012345678901 o mi.alias.banco"
                    maxLength={100}
                  />
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: '.3rem' }}>
                    TMC necesita este dato para transferirte los pagos de tus reservas.
                  </div>
                </div>
              )}

              {/* Mini mapa cuando hay ubicación */}
              {perfilForm.lat && perfilForm.lng && (
                <div style={{ borderRadius: 'var(--r2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${perfilForm.lat},${perfilForm.lng}&z=15&output=embed`}
                    style={{ width: '100%', height: 150, border: 'none', display: 'block' }}
                    loading="lazy"
                    title="Ubicación"
                  />
                </div>
              )}

              {perfilError && <div className="alert alert--error">{perfilError}</div>}

              <div style={{ display: 'flex', gap: '.75rem' }}>
                <Button variant="secondary" onClick={() => setPerfilOpen(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarPerfil} loading={perfilLoading} style={{ flex: 2 }}>
                  Guardar perfil
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal extensión de reserva */}
      <Modal
        open={extModal}
        onClose={() => setExtModal(false)}
        title="📅 Extender mi reserva"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: '1rem' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.3rem' }}>Espacio</div>
            <div style={{ fontWeight: 700 }}>{extEspacioNombre}</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: '1rem' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.3rem' }}>Vencimiento actual</div>
            <div style={{ fontWeight: 700 }}>{extFechaHastaActual}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text2)', marginBottom: '.4rem' }}>
              Nueva fecha de vencimiento
            </label>
            <input
              type="date"
              min={extFechaHastaActual ? (() => { const d = new Date(extFechaHastaActual); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })() : ''}
              value={extNuevaFecha}
              onChange={e => calcularExtension(e.target.value)}
              style={{
                width: '100%', padding: '.65rem .9rem', borderRadius: 'var(--r2)',
                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                color: 'var(--text)', fontSize: '.9rem',
              }}
            />
          </div>
          {extNuevaFecha && extNuevaFecha > extFechaHastaActual && (
            <div style={{ background: 'rgba(232,98,42,.1)', border: '1px solid rgba(232,98,42,.3)', borderRadius: 'var(--r2)', padding: '1rem' }}>
              <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: '.2rem' }}>Días a extender</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e8622a' }}>{extDias} día{extDias !== 1 ? 's' : ''}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.4rem' }}>
                El precio exacto se calculará al presionar el botón de pago.
              </div>
            </div>
          )}
          {extError && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r2)', padding: '.8rem 1rem', color: '#f87171', fontSize: '.85rem' }}>
              {extError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setExtModal(false)}
              style={{ padding: '.55rem 1.2rem', borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: '.88rem' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleExtender}
              disabled={!extNuevaFecha || extNuevaFecha <= extFechaHastaActual || extLoading}
              style={{
                padding: '.55rem 1.4rem', borderRadius: 'var(--r2)', border: 'none',
                background: 'linear-gradient(135deg, #e8622a, #d4521a)', color: '#fff',
                fontWeight: 700, cursor: extNuevaFecha && extNuevaFecha > extFechaHastaActual ? 'pointer' : 'not-allowed',
                opacity: !extNuevaFecha || extNuevaFecha <= extFechaHastaActual ? 0.5 : 1, fontSize: '.88rem',
              }}
            >
              {extLoading ? 'Procesando...' : '💳 Pagar extensión →'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal calificación */}
      <Modal
        open={reviewModal}
        onClose={() => setReviewModal(false)}
        title="⭐ Calificar espacio"
        subtitle={reviewEspacioNombre}
        maxWidth="440px"
      >
        {reviewOk ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🎉</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>¡Gracias por tu reseña!</div>
            <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginTop: '.3rem' }}>Tu opinión ayuda a la comunidad.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Star picker */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: '.5rem' }}>¿Cuántas estrellas le das?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '.3rem' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '2rem', lineHeight: 1,
                      color: n <= reviewRating ? 'var(--orange)' : '#ccc',
                      transition: 'color .15s, transform .1s',
                      transform: n <= reviewRating ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >★</button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.3rem' }}>
                  {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][reviewRating]}
                </div>
              )}
            </div>

            {/* Texto */}
            <div>
              <label className="form-label">Comentario (opcional)</label>
              <textarea
                rows={3}
                value={reviewTexto}
                onChange={e => setReviewTexto(e.target.value)}
                placeholder="Contanos tu experiencia con el espacio…"
                style={{ marginTop: '.4rem' }}
              />
            </div>

            {reviewError && <div className="alert alert--error">{reviewError}</div>}

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <Button variant="secondary" onClick={() => setReviewModal(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                onClick={handleEnviarReview}
                loading={reviewLoading}
                disabled={!reviewRating}
                style={{ flex: 2 }}
              >
                Enviar calificación
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal edición espacio */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title="✏️ Editar espacio"
        subtitle={editando?.nombre}
        maxWidth="580px"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>

          {/* Pestañas */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: 0 }}>
            {([
              { key: 'datos',      label: '📋 Datos generales' },
              { key: 'calendario', label: '📅 Calendario' },
              { key: 'seguridad',  label: '🛡️ Seguridad' },
            ] as const).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setEditTab(t.key)}
                style={{
                  flex: 1,
                  padding: '.6rem .4rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2.5px solid ${editTab === t.key ? 'var(--orange)' : 'transparent'}`,
                  marginBottom: -2,
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: editTab === t.key ? 700 : 500,
                  fontSize: '.78rem',
                  color: editTab === t.key ? 'var(--orange)' : 'var(--text3)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab 1: Datos generales ── */}
          {editTab === 'datos' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Categoría */}
              <div>
                <label className="form-label">Tipo de espacio</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.4rem', marginTop: '.4rem' }}>
                  {CATEGORIAS.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => setEditForm(f => ({ ...f, categoria: c.value }))}
                      style={{
                        padding: '.5rem', borderRadius: 'var(--r2)', cursor: 'pointer',
                        border: `2px solid ${editForm.categoria === c.value ? 'var(--orange)' : 'var(--border)'}`,
                        background: editForm.categoria === c.value ? 'rgba(232,98,42,.1)' : 'var(--surface2)',
                        color: editForm.categoria === c.value ? 'var(--orange)' : 'var(--text2)',
                        fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '.75rem', textAlign: 'center',
                      }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Nombre *</label>
                <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del espacio" />
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea rows={3} value={editForm.descripcion}
                  onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Describí tu espacio…" />
              </div>

              <div>
                <label className="form-label">Dirección</label>
                <input ref={editDireccionRef} value={editForm.direccion} onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))}
                  placeholder="Calle y número" />
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Moneda</label>
                  <select value={editForm.moneda} onChange={e => setEditForm(f => ({ ...f, moneda: e.target.value }))}>
                    {MONEDAS.map(m => (
                      <option key={m.value} value={m.value}>{m.flag} {m.label} ({m.simbolo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Superficie (m²)</label>
                  <input type="number" value={editForm.m2} min="1"
                    onChange={e => setEditForm(f => ({ ...f, m2: e.target.value }))}
                    placeholder="" />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Precio por día</label>
                  <input type="number" value={editForm.precio_dia} min="0"
                    onChange={e => setEditForm(f => ({ ...f, precio_dia: e.target.value }))}
                    placeholder="850" />
                </div>
                <div>
                  <label className="form-label">Precio por mes</label>
                  <input type="number" value={editForm.precio_mes} min="0"
                    onChange={e => setEditForm(f => ({ ...f, precio_mes: e.target.value }))}
                    placeholder="18000" />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Calendario ── */}
          {editTab === 'calendario' && (
            <CalendarioDisponibilidad
              precioDia={Number(editForm.precio_dia) || 0}
              precioMes={Number(editForm.precio_mes) || 0}
              value={editDisponibilidad}
              onChange={setEditDisponibilidad}
            />
          )}

          {/* ── Tab 3: Seguridad ── */}
          {editTab === 'seguridad' && (
            <SeguridadChecklist
              seguridad={editSeguridad}
              onChange={key => setEditSeguridad(s => ({ ...s, [key]: !s[key] }))}
            />
          )}

          {editError && <div className="alert alert--error">{editError}</div>}

          <div style={{ display: 'flex', gap: '.75rem' }}>
            <Button variant="secondary" onClick={() => setEditando(null)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarEdicion} loading={editLoading} style={{ flex: 2 }}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
