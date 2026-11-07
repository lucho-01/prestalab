import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Usuario } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');

    let query: FirebaseFirestore.Query = adminDb.collection('usuarios');

    if (rol && rol !== 'todos') {
      query = query.where('rol', '==', rol);
    }

    const snapshot = await query.get();
    const usuarios: Usuario[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Usuario));

    return NextResponse.json({ success: true, data: usuarios });
  } catch (error: any) {
    console.error('Error fetching usuarios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      email,
      telefono,
      genero = 'Masculino',
      rol = 'estudiante',
      departamento,
      laboratoriosAsignados = [],
      matriculaOCodigo,
    } = body;

    if (!nombre || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo son obligatorios' }, { status: 400 });
    }

    const docRef = adminDb.collection('usuarios').doc();
    const nuevoUsuario: Usuario = {
      id: docRef.id,
      nombre,
      email,
      telefono: telefono || '',
      genero,
      rol,
      departamento: departamento || 'Facultad de Ingeniería',
      matriculaOCodigo: matriculaOCodigo || `USR-${Math.floor(100 + Math.random() * 900)}`,
      laboratoriosAsignados: rol === 'gestor' ? laboratoriosAsignados : [],
      createdAt: new Date().toISOString(),
    };

    await docRef.set(nuevoUsuario);

    return NextResponse.json({ success: true, data: nuevoUsuario }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating usuario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
