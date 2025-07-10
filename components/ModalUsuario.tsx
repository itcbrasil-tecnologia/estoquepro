'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { db, secondaryAuth } from '@/lib/firebase';
import { collection, doc, setDoc, where, query, getDocs, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Usuario } from '@/types';

interface ModalUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: Usuario | null;
}

export default function ModalUsuario({ isOpen, onClose, userToEdit }: ModalUsuarioProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('common');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (userToEdit) {
        setUsername(userToEdit.username);
        setEmail(userToEdit.email);
        setRole(userToEdit.role);
        setPassword(''); // Senha não é editável, apenas na criação
    } else {
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('common');
    }
  }, [userToEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (userToEdit) { // Editando um usuário existente
            const userRef = doc(db, "usuarios", userToEdit.id);
            await updateDoc(userRef, { role });
            addToast('Perfil de usuário atualizado com sucesso!', 'success');
        } else { // Criando um novo usuário
            if (password.length < 6) {
                throw new Error("A senha deve ter pelo menos 6 caracteres.");
            }
            const usersRef = collection(db, "usuarios");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error("Este nome de usuário já está em uso.");
            }

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, "usuarios", uid), {
                username,
                email,
                role
            });
            addToast('Usuário criado com sucesso!', 'success');
        }
        onClose();
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      if(err.code === 'auth/email-already-in-use') {
          setError("Este email já está em uso.");
      } else {
          setError(err.message || "Falha ao salvar usuário.");
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? `Editar Usuário: ${userToEdit.username}` : "Adicionar Novo Usuário"}>
      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário (username)</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={!!userToEdit} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"/></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!userToEdit} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"/></div>
          {!userToEdit && (
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
          )}
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nível de Acesso</label><select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="common">Comum</option><option value="master">Master</option></select></div>
        </div>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="flex justify-end mt-8 space-x-4">
            <button type="button" onClick={onClose} className="btn-cancel bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center w-28">
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Salvar'}
            </button>
        </div>
      </form>
    </Modal>
  );
}