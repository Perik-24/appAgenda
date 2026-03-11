import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../src/context/TemaContext';
import { auth } from '../../src/firebase/firebaseConfig';
import { db } from '../../src/firebase/firestore';
import { r } from '../../src/utils/responsive';


export default function ClientesScreen() {

    const [search, setSearch] = useState('');
    const router = useRouter();
    const { colors, darkMode } = useTema();
    // Estado para mostrar el modal de nuevo/editar cliente
    const [modalNuevo, setModalNuevo] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const insets = useSafeAreaInsets();
    //Estado para lista de expedientes
    const [expedientes, setExpedientes] = useState<any[]>([]);
    // Estado para filtro de expedientes
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const total = expedientes.length;
    const abiertos = expedientes.filter(e => (e.estado ?? 'abierto') === 'abierto').length;
    const cerrados = expedientes.filter(e => (e.estado ?? 'abierto') === 'cerrado').length;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
        },
        title: {
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 8
        },
        Header_botones: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%',
            borderRadius: 8,
            marginBottom: 16,
        },
        cards: {
            position: 'relative',
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderRadius: r.cardRadius,
            paddingVertical: r.cardPad,
            paddingHorizontal: r.cardPad,
            marginVertical: r.gap,
            alignItems: 'center',
            minHeight: 100,
        },
        detailsCards: {
            flex: 1,
            marginRight: 8,
        },
        nombreCliente: {
            fontSize: r.inputFontSz,
            fontWeight: '700',
            marginBottom: 4,
            color: colors.primary,
            flexWrap: 'wrap',
        },
        casoCliente: {
            fontSize: r.label,
            color: colors.text,
            marginTop: 2,
        },
        folioText: {
            fontSize: 11,
            color: '#9ca3af',
            fontWeight: '600',
        },
        abrirExpediente: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        btnAbrirExpediente: {
            paddingVertical: r.btnPadV,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: r.btnRadius,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 92,
        },
        btnEditarExpediente: {
            paddingVertical: r.btnPadV,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: r.btnRadius,
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
        },
        btnText: {
            fontWeight: '700',
            color: '#fff',
            fontSize: r.btnFontSz,
        },
        btnNuevo: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            opacity: 1,
            position: 'absolute',
            bottom: r.padV,
            right: r.padH,
            paddingVertical: r.btnPadV,
            paddingHorizontal: r.inputPadH,
            borderRadius: r.btnRadius,
            alignItems: 'center',
            justifyContent: 'center'
        },
        btnFiltro: {
            flex: 1,
            marginHorizontal: 4,
            paddingVertical: r.tabPadV,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: r.radiusSm,
            backgroundColor: colors.card,
            alignItems: 'center',
        },
        btnFiltroActivo: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        btnFiltroText: {
            fontWeight: '700',
            color: colors.text,
        },
        btnFiltroTextActivo: {
            color: '#fff',
        },
        badge: {
            alignSelf: 'flex-start',
            marginTop: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
        },
        badgeText: {
            color: '#fff',
            fontSize: r.small,
            fontWeight: '700',
        },
    })

    useEffect(() => {
        const q = query(collection(db, 'expedientes'), where('usuario', '==', auth.currentUser?.uid), orderBy('fechaRegistro', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setExpedientes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);


    const [form, setForm] = useState({
        id: '',
        nombreCliente: '',
        casoCliente: '',
        numeroExpediente: '',
        prioridad: '',
        estado: 'abierto' as 'abierto' | 'cerrado',
    });

    const abrirEditar = (exp: any) => {
        setForm({ id: exp.id, nombreCliente: exp.nombreCliente ?? '', casoCliente: exp.casoCliente ?? '', numeroExpediente: exp.numeroExpediente ?? '', prioridad: exp.prioridad ?? '', estado: exp.estado ?? 'abierto' });
        setModalEditar(true);
        setModalNuevo(true);
    };

    const abrirNuevo = () => {
        setForm({ id: '', nombreCliente: '', casoCliente: '', numeroExpediente: '', prioridad: '', estado: 'abierto' });
        setModalEditar(false);
        setModalNuevo(true);
    }

    const guardar = async () => {
        if (guardando) return;

        if (!form.nombreCliente.trim() || !form.casoCliente.trim() || !form.prioridad.trim()) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        try {
            setGuardando(true);

            if (modalEditar) {
                await updateDoc(doc(db, 'expedientes', form.id), {
                    nombreCliente: form.nombreCliente.trim(),
                    casoCliente: form.casoCliente.trim(),
                    numeroExpediente: form.numeroExpediente.trim(),
                    prioridad: form.prioridad.trim(),
                    estado: form.estado,
                });
            } else {
                await addDoc(collection(db, 'expedientes'), {
                    nombreCliente: form.nombreCliente.trim(),
                    casoCliente: form.casoCliente.trim(),
                    numeroExpediente: form.numeroExpediente.trim(),
                    prioridad: form.prioridad.trim(),
                    estado: 'abierto',
                    fechaRegistro: serverTimestamp(),
                    usuario: auth.currentUser?.uid,
                });
            }

            setModalNuevo(false);
            setModalEditar(false);
            setForm({
                id: '',
                nombreCliente: '',
                casoCliente: '',
                numeroExpediente: '',
                prioridad: '',
                estado: 'abierto',
            })
        } catch (error) {
            Alert.alert('Error', modalEditar ? 'No se pudo actualizar el expediente' : 'No se pudo crear el expediente');
        } finally {
            setGuardando(false);
        }
    };

    type FiltroEstado = 'todos' | 'abierto' | 'cerrado';
    type Prioridad = 'Alta' | 'Media' | 'Baja';

    type Expediente = {
        id: string;
        nombreCliente: string;
        casoCliente: string;
        estado?: 'abierto' | 'cerrado';
        usuario?: string;
        numeroExpediente?: string;
        prioridad?: Prioridad | string;
    }

    const Prioridad = (valor?: string) => {
        return (valor ?? '').trim().toLocaleLowerCase();
    }

    const Semaforo = (valor?: string) => {
        const p = Prioridad(valor);
        if (p === 'alta') return '#dc2626';
        if (p === 'media') return '#eab308';
        if (p === 'baja') return '#16a34a';
        return '#6b7280';
    }

    const PrioridadUI = (nivel: string) => {
        const color = nivel.trim().toLocaleLowerCase();
        if (color === 'alta') return '#dc2626';
        if (color === 'media') return '#eab308';
        if (color === 'baja') return '#16a34a';
        return colors.border;
    }

    const expedientesFiltrados = useMemo(() => {
        const texto = search.trim().toLocaleLowerCase();

        return expedientes
            .filter((e) => filtroEstado === 'todos' ? true : (e.estado ?? 'abierto') === filtroEstado)
            .filter((e) => {
                if (!texto) return true;
                return (
                    (e.nombreCliente ?? '').toLowerCase().includes(texto) ||
                    (e.casoCliente ?? '').toLowerCase().includes(texto)
                );
            });
    }, [expedientes, filtroEstado, search]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* HEADER */}
            <View style={{ paddingHorizontal: r.padH, paddingTop: insets.top + r.padV, paddingBottom: r.padV }}>
                <Text style={{ fontSize: r.h1, color: colors.text, fontWeight: 'bold' }}>Expedientes Clientes</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: r.padH, paddingBottom: r.padV }}>
                <View style={styles.container}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.card,
                        borderRadius: r.radiusSm,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: r.inputPadH,
                        marginBottom: r.gap,
                    }}>
                        <Feather name="search" size={24} color={colors.text} />
                        <TextInput
                            placeholder="Buscar expediente..."
                            placeholderTextColor={colors.border}
                            value={search}
                            onChangeText={setSearch}
                            style={{
                                flex: 1,
                                color: colors.text,
                                paddingVertical: r.inputPadV,
                                paddingHorizontal: r.inputPadH,
                                marginLeft: r.gap / 2,
                            }}
                        />
                    </View>
                    <View style={styles.Header_botones}>
                        <Pressable style={[styles.btnFiltro, filtroEstado === 'todos' && styles.btnFiltroActivo]} onPress={() => setFiltroEstado('todos')}>
                            <Text style={[styles.btnFiltroText, filtroEstado === 'todos' && styles.btnFiltroTextActivo]}>Todos ({total})</Text>
                        </Pressable>
                        <Pressable style={[styles.btnFiltro, filtroEstado === 'abierto' && styles.btnFiltroActivo]} onPress={() => setFiltroEstado('abierto')}>
                            <Text style={[styles.btnFiltroText, filtroEstado === 'abierto' && styles.btnFiltroTextActivo]}>Abiertos ({abiertos})</Text>
                        </Pressable>
                        <Pressable style={[styles.btnFiltro, filtroEstado === 'cerrado' && styles.btnFiltroActivo]} onPress={() => setFiltroEstado('cerrado')}>
                            <Text style={[styles.btnFiltroText, filtroEstado === 'cerrado' && styles.btnFiltroTextActivo]}>Cerrados ({cerrados})</Text>
                        </Pressable>
                    </View>
                    {/* Aquí se mostrarán los expedientes filtrados según la búsqueda y el estado */}
                    {expedientesFiltrados.length === 0 ? (
                        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                            <Text style={{ color: colors.border, fontSize: r.body }}>
                                {search ? 'No hay resultados para tu búsqueda' : 'Aún no hay expedientes'}
                            </Text>
                        </View>
                    ) : (
                        expedientesFiltrados.map((expediente: Expediente) => (
                            <View
                                key={expediente.id} style={[
                                    styles.cards,
                                    {
                                        borderLeftWidth: 5,
                                        borderLeftColor: Semaforo(expediente.prioridad)
                                    }
                                ]}>
                                <View style={styles.detailsCards}>
                                    {!!expediente.numeroExpediente && (
                                        <Text style={styles.folioText}>Folio: {expediente.numeroExpediente}</Text>
                                    )}
                                    <Text style={styles.nombreCliente} numberOfLines={1} ellipsizeMode='tail'>{expediente.nombreCliente}</Text>
                                    <Text style={styles.casoCliente}>{expediente.casoCliente}</Text>
                                    <View style={[styles.badge, { backgroundColor: (expediente.estado ?? 'abierto') === 'abierto' ? '#16a34a' : '#6b7280' }]}>
                                        <Text style={styles.badgeText}>{(expediente.estado ?? 'abierto').toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'column', gap: 6 }}>
                                    <Pressable style={styles.btnAbrirExpediente} onPress={() =>
                                        router.push({ pathname: '/(tabs)/expedientes', params: { id: expediente.id } })
                                    }>
                                        <Text style={styles.btnText}>Ver expediente</Text>
                                    </Pressable>
                                    <Pressable style={styles.btnEditarExpediente} onPress={() => { abrirEditar(expediente) }}>
                                        <Feather name="edit-2" size={14} color={colors.text} />
                                    </Pressable>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
            <Pressable style={({ pressed }) => ({
                ...styles.btnNuevo,
                backgroundColor: pressed ? '#1e90ff' : '#3488ff',
                borderColor: pressed ? '#1e90ff' : '#3488ff',
                opacity: pressed ? 0.8 : 1,
            })} onPress={() => abrirNuevo()}>
                <AntDesign name="plus" size={26} color="white" />
            </Pressable>
            <Modal
                visible={modalNuevo}
                transparent
                animationType="slide"
                onRequestClose={() => setModalNuevo(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <View style={{ width: '100%', backgroundColor: colors.card, borderTopLeftRadius: r.radiusLg, borderTopRightRadius: r.radiusLg, padding: r.padH }}>
                        <Text style={{ fontSize: r.h2, fontWeight: 'bold', color: colors.text, marginBottom: r.gap }}>{modalEditar ? 'Editar Expediente' : 'Nuevo Expediente'}</Text>
                        <TextInput
                            placeholder="Nombre del Cliente"
                            placeholderTextColor={colors.border}
                            value={form.nombreCliente}
                            onChangeText={(v) => setForm(prev => ({ ...prev, nombreCliente: v }))}
                            style={{
                                backgroundColor: darkMode ? '#2a2a2a' : '#f4f4f4',
                                paddingVertical: r.inputPadV, paddingHorizontal: r.inputPadH, borderRadius: r.inputRadius, color: colors.text, fontSize: r.inputFontSz, marginBottom: r.gap / 1.2
                            }}
                        />
                        <TextInput
                            placeholder="Caso"
                            placeholderTextColor={colors.border}
                            value={form.casoCliente}
                            onChangeText={(v) => setForm(prev => ({ ...prev, casoCliente: v }))}
                            style={{
                                backgroundColor: darkMode ? '#2a2a2a' : '#f4f4f4',
                                paddingVertical: r.inputPadV, paddingHorizontal: r.inputPadH, borderRadius: r.inputRadius, color: colors.text, fontSize: r.inputFontSz, marginBottom: r.gap / 1.2
                            }}
                        />
                        <TextInput
                            placeholder="Número de expediente (ej. 1234/2026)"
                            placeholderTextColor={colors.border}
                            value={form.numeroExpediente}
                            onChangeText={(v) => setForm(prev => ({ ...prev, numeroExpediente: v }))}
                            style={{
                                backgroundColor: darkMode ? '#2a2a2a' : '#f4f4f4',
                                paddingVertical: r.inputPadV, paddingHorizontal: r.inputPadH, borderRadius: r.inputRadius, color: colors.text, fontSize: r.inputFontSz, marginBottom: r.gap / 1.2
                            }}
                        />
                        <Text style={{ color: colors.text, fontWeight: '700', marginBottom: r.gap / 2 }}>
                            Prioridad
                        </Text>
                        <View style={{ flexDirection: 'row', gap: r.gap / 2, marginBottom: r.gap / 1.2 }}>
                            {['Alta', 'Media', 'Baja'].map((item) => {
                                const activo = form.prioridad === item;
                                const color = PrioridadUI(item);
                                return (
                                    <Pressable
                                        key={item}
                                        onPress={() => setForm(prev => ({ ...prev, prioridad: item }))}
                                        style={{
                                            flex: 1,
                                            paddingVertical: r.btnPadV,
                                            borderRadius: r.btnRadius,
                                            borderWidth: 1,
                                            borderColor: activo ? color : colors.border,
                                            backgroundColor: activo ? color : colors.card,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ color: activo ? '#fff' : colors.text, fontWeight: '700' }}>
                                            {item}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        {modalEditar && (
                            <View style={{ marginBottom: r.gap }}>
                                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: r.gap / 2 }}>
                                    Estado
                                </Text>
                                <View style={{ flexDirection: 'row', gap: r.gap / 2 }}>
                                    {(['abierto', 'cerrado'] as const).map((item) => {
                                        const activo = form.estado === item;
                                        const color = item === 'abierto' ? '#16a34a' : '#6b7280';
                                        return (
                                            <Pressable
                                                key={item}
                                                onPress={() => setForm(prev => ({ ...prev, estado: item }))}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: r.btnPadV,
                                                    borderRadius: r.btnRadius,
                                                    borderWidth: 1,
                                                    borderColor: activo ? color : colors.border,
                                                    backgroundColor: activo ? color : colors.card,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{ color: activo ? '#fff' : colors.text, fontWeight: '700', textTransform: 'capitalize' }}>
                                                    {item}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                        <View style={{ justifyContent: 'flex-end', gap: r.gap }}>
                            <Pressable
                                disabled={guardando}
                                onPress={guardar}
                                style={({ pressed }) => ({
                                    backgroundColor: guardando ? '#9ca3af' : (pressed ? '#1e90ff' : '#3488ff'),
                                    borderColor: pressed ? '#1e90ff' : '#3488ff',
                                    opacity: guardando ? 0.7 : (pressed ? 0.8 : 1),
                                    paddingVertical: r.btnPadV,
                                    paddingHorizontal: 2,
                                    borderRadius: r.btnRadius,
                                })}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: r.btnFontSz }}>
                                    {guardando ? 'Guardando...' : modalEditar ? 'Guardar cambios' : 'Crear'}
                                </Text>
                            </Pressable>
                            <Pressable onPress={() => { setModalNuevo(false); setModalEditar(false); }}>
                                <Text style={{ color: 'red', textAlign: 'center', fontSize: r.body }}>Cancelar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

