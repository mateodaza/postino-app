import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/utils/supabase';
import Layout from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  FileText,
  Maximize,
  Minimize,
  XCircle,
} from 'lucide-react';
import SignatureTimeline from '@/components/Document/signatureTimeline';
import { useAuth } from '@/hooks/useAuth';
import SignDocumentSection from '@/components/Document/signDocumentSection';

const MotionCard = motion(Card);

interface DocumentType {
  id: string;
  ipfs_hash: string;
  created_at: string;
  remaining_signatures: number;
  required_signatures: number;
  user_signatures: any[];
}

interface DocumentPreviewProps {
  ipfsHash: string;
  isFullView: boolean;
  setIsFullView: (isFullView: boolean) => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = React.memo(
  ({ ipfsHash, isFullView, setIsFullView }) => (
    <MotionCard
      className='mb-8 overflow-hidden'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CardHeader className='border-b border-gray-100'>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center'>
            <FileText className='mr-2' />
            Document Preview
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsFullView(!isFullView)}
          >
            {isFullView ? (
              <Minimize className='mr-2' />
            ) : (
              <Maximize className='mr-2' />
            )}
            {isFullView ? 'Minimize' : 'Full View'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <motion.div
          animate={{ height: isFullView ? '80vh' : '300px' }}
          transition={{ duration: 0.3 }}
        >
          <iframe
            src={`https://peach-fuzzy-woodpecker-421.mypinata.cloud/ipfs/${ipfsHash}`}
            className='w-full h-full border-0'
            title='PDF Preview'
          />
        </motion.div>
      </CardContent>
    </MotionCard>
  )
);

interface DocumentDetailsCardProps {
  document: DocumentType;
  canSign: boolean;
  hasUserSigned: boolean;
  handleSignClick: () => void;
  handleSigningComplete: () => void;
  isSigningSectionVisible: boolean;
}

const DocumentDetailsCard: React.FC<DocumentDetailsCardProps> = React.memo(
  ({
    document,
    canSign,
    hasUserSigned,
    handleSignClick,
    handleSigningComplete,
    isSigningSectionVisible,
  }) => (
    <MotionCard
      className='mb-8 overflow-hidden'
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <CardHeader className='border-b border-gray-100'>
        <CardTitle>Document Details</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-6 p-6'>
        <div className='flex items-center space-x-3'>
          <Calendar className='text-yellow-500' />
          <div>
            <p className='text-sm font-medium text-gray-500'>Created</p>
            <p className='text-gray-700'>
              {new Date(document.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          {document.remaining_signatures === 0 ? (
            <CheckCircle className='text-green-500' />
          ) : (
            <XCircle className='text-red-500' />
          )}
          <div>
            <p className='text-sm font-medium text-gray-500'>Status</p>
            <Badge
              variant={
                document.remaining_signatures === 0 ? 'default' : 'destructive'
              }
              className='mt-1'
            >
              {document.remaining_signatures === 0 ? 'Completed' : 'Pending'}
            </Badge>
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          <FileText className='text-yellow-500' />
          <div>
            <p className='text-sm font-medium text-gray-500'>
              Required Signatures
            </p>
            <p className='text-gray-700'>{document.required_signatures}</p>
          </div>
        </div>
        {document.remaining_signatures > 0 && (
          <div className='flex items-center space-x-3'>
            <FileText className='text-yellow-500' />
            <div>
              <p className='text-sm font-medium text-gray-500'>
                Remaining signatures
                <br /> {document.remaining_signatures}
              </p>
            </div>
          </div>
        )}
        {hasUserSigned ? (
          <div className='col-span-2 mt-4'>
            <Badge variant='outline' className='text-center w-full py-2'>
              You have already signed this document
            </Badge>
          </div>
        ) : canSign && !isSigningSectionVisible ? (
          <div className='col-span-2 mt-4'>
            <Button
              variant='outline'
              onClick={handleSignClick}
              className='w-full'
            >
              Sign Document
            </Button>
          </div>
        ) : canSign && isSigningSectionVisible ? (
          <div className='col-span-2 mt-4'>
            <SignDocumentSection
              documentId={document.id}
              ipfsHash={document.ipfs_hash}
              onSigningComplete={handleSigningComplete}
            />
          </div>
        ) : null}
      </CardContent>
    </MotionCard>
  )
);

interface SignaturesTimelineCardProps {
  signatures: any[];
}

const SignaturesTimelineCard: React.FC<SignaturesTimelineCardProps> =
  React.memo(({ signatures }) => (
    <MotionCard
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <CardHeader className='border-b border-gray-100'>
        <CardTitle>Signature Timeline</CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <SignatureTimeline signatures={signatures} />
      </CardContent>
    </MotionCard>
  ));

const DocumentDetails: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ipfsHash } = router.query;
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [isSigningSectionVisible, setIsSigningSectionVisible] =
    useState<boolean>(false);

  const fetchDocumentDetails = useCallback(async (hash: string) => {
    try {
      setLoading(true);
      // Fetch document details
      let { data: documentData, error: documentError } = await supabase
        .from('pending_documents')
        .select('*')
        .eq('ipfs_hash', hash)
        .single();

      if (documentError) throw documentError;
      if (!documentData) {
        setError('Document not found');
        return;
      }

      // Fetch associated signatures
      let { data: signaturesData, error: signaturesError } = await supabase
        .from('user_signatures')
        .select(
          `
          *,
          users (id, worldcoin_id, ethereum_address)
        `
        )
        .eq('document_id', documentData.id)
        .order('created_at', { ascending: true });

      if (signaturesError) throw signaturesError;

      // Combine document data with signatures
      setDocument({
        ...documentData,
        user_signatures: signaturesData || [],
      });
    } catch (err) {
      setError('Error fetching document details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof ipfsHash === 'string') {
      fetchDocumentDetails(ipfsHash);
    }
  }, [ipfsHash, fetchDocumentDetails]);

  const canSign = useMemo(
    () => document && document.remaining_signatures > 0 && user,
    [document, user]
  );

  const hasUserSigned = useMemo(() => {
    if (!document || !user) return false;
    return document.user_signatures.some(
      (signature) =>
        signature.users.worldcoin_id === user.name ||
        signature.users.ethereum_address === user.address
    );
  }, [document, user]);

  const handleSignClick = useCallback(() => {
    setIsSigningSectionVisible(true);
  }, []);

  const handleSigningComplete = useCallback(() => {
    setIsSigningSectionVisible(false);
    if (typeof ipfsHash === 'string') {
      fetchDocumentDetails(ipfsHash);
    }
  }, [ipfsHash, fetchDocumentDetails]);

  const LoadingSkeleton: React.FC = React.memo(() => (
    <div className='space-y-6'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-12 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
      <div className='grid grid-cols-2 gap-6'>
        <Skeleton className='h-24' />
        <Skeleton className='h-24' />
        <Skeleton className='h-24' />
        <Skeleton className='h-24' />
      </div>
    </div>
  ));

  return (
    <Layout>
      <div className='p-6 max-w-4xl mx-auto'>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardContent className='pt-6'>
              <p className='text-center text-red-500'>{error}</p>
            </CardContent>
          </MotionCard>
        ) : document ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className='text-3xl font-bold mb-6 text-gray-800'>
              Document: {document.ipfs_hash.substring(0, 15)}...
            </h1>

            <DocumentPreview
              ipfsHash={document.ipfs_hash}
              isFullView={isFullView}
              setIsFullView={setIsFullView}
            />
            <DocumentDetailsCard
              document={document}
              canSign={canSign}
              hasUserSigned={hasUserSigned}
              handleSignClick={handleSignClick}
              handleSigningComplete={handleSigningComplete}
              isSigningSectionVisible={isSigningSectionVisible}
            />

            {document.user_signatures &&
              document.user_signatures.length > 0 && (
                <SignaturesTimelineCard signatures={document.user_signatures} />
              )}
          </motion.div>
        ) : (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardContent className='pt-6'>
              <p className='text-center text-gray-500'>Document not found</p>
            </CardContent>
          </MotionCard>
        )}
      </div>
    </Layout>
  );
};

export default DocumentDetails;
